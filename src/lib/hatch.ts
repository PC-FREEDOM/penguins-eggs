/**
 * penguins-eggs: hatch.js 
 * 
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 * https://codeburst.io/how-to-build-a-command-line-app-in-node-js-using-typescript-google-cloud-functions-and-firebase-4c13b1699a27
 * 
 */

"use strict";

import shell from "shelljs";
import fs from "fs";
import os from "os";
import inquirer from "inquirer";
import drivelist from "drivelist";

import utils from "./utils";
import filters from "./filters";
import { IDevice, IDevices, IDriveList } from "../interfaces";
import { description } from "pjson";

export async function hatch() {
  let target = "/TARGET";
  let devices = {} as IDevices;
  devices.root = {} as IDevice;
  devices.swap = {} as IDevice;

  devices.root.device = "/dev/sda1";
  devices.root.fsType = "ext4";
  devices.root.mountPoint = "/";
  devices.swap.device = "/dev/sda2";
  devices.swap.fsType = "swap";
  devices.swap.mountPoint = "none";


  let dl: string[] = [];
  await drivelist.list(
    (error: boolean, drives: IDriveList[]) => {
      if (error) {
        throw error;
      }
      let aDrives: string[] = [];

      drives.forEach((drive) => {
        dl.push(drive.device);
      });
    });


  let varOptions: any = await getOptions(dl);
  let options: any = JSON.parse(varOptions);


  let isDiskPrepared: boolean;
  isDiskPrepared = await diskPrepareNoLvm(options.installationDevice);

  /**
   * indentazione secondo installazione
   */
  await mkfs(devices);
  await mount4target(target, devices);
    await rsync(target);
    await fstab(target, devices);
    await hostname(target, options);
    await resolvConf(target, options);
    await interfaces(target, options);
    await hosts(target, options);
    await mountVFS(target);
      await mkinitramfs(target);
      await grubInstall(target, options);
      await utils.addUser(options.username, options.userpassword);
      await utils.changePassword(`root`, options.rootpassword);
      await delUserLive();
      await patchPve(target);
    await umountVFS(target);
  await umount4target(target, devices);

}


/**
 * delUserLive
 */
async function delUserLive() {
  console.log("Cancellazione utente live\n");
}


/**
 * patchPve patch per proxypve che non crea la directory
 *          e che ricrea i codici di ssh della macchina
 * @param target 
 */
async function patchPve(target: string) {
  // patch per apache2
  await execute(`chroot ${target} mkdir /var/log/apache2`);

  await execute(`chroot ${target} mkdir /var/log/pveproxy`);
  await execute(`chroot ${target} touch /var/log/pveproxy/access.log`);
  await execute(`chroot ${target} chown www-data:www-data /var/log/pveproxy -R`);
  await execute(`chroot ${target} chmod 0664 /var/log/pveproxy/access.log`);
  await execute(`chroot ${target} dpkg-reconfigure openssh-server`);
}

/**
 * grubInstall()
 * @param target 
 * @param options 
 */
async function grubInstall(target: string, options: any) {
  console.log("grub-install");
  await execute(`chroot ${target} grub-install ${options.installationDevice}`);
  console.log("update-grub");
  await execute(`chroot ${target} update-grub`);
}

/**
 * mkinitramfs()
 * @param target 
 */
async function mkinitramfs(target: string) {
  console.log("mkinitramfs");
  /*
  await execute(
    `chroot ${target} mkinitramfs -k -o /tmp/initramfs-$(uname -r)`
  );*/
  await execute(`chroot ${target} live-update-initramfs -k -o /tmp/initramfs-$(uname -r)`)
  await execute(`cp ${target}/tmp/initramfs-$(uname -r) /TARGET/boot`);
}

/**
 * updateInitramfs()
 * @param target 
 */
async function updateInitramfs(target: string) {
  console.log("updateInitramfs");
  await execute(`chroot ${target} update-initramfs -u`);
}

/**
 * mountVFS()
 * @param target 
 */
async function mountVFS(target: string) {
  console.log("mount VFS");
  await execute(`mount -o bind /dev ${target}/dev`);
  await execute(`mount -o bind /devpts ${target}/dev/pts`);
  await execute(`mount -o bind /proc ${target}/proc`);
  await execute(`mount -o bind /sys ${target}/sys`);
  await execute(`mount -o bind /run ${target}/run`);
}

/**
 * umountVFS()
 * @param target 
 */
async function umountVFS(target: string) {
  console.log("umount VFS");
  await execute(`umount ${target}/dev/pts`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/dev`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/proc`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/sys`);
  await execute(`sleep 1`);
  await execute(`umount ${target}/run`);
  await execute(`sleep 1`);
}

/**
 * fstab()
 * @param target 
 * @param devices 
 */
async function fstab(target: string, devices: IDevices) {
  let file = `${target}/etc/fstab`;
  let text = `
proc /proc proc defaults 0 0
${devices.root.device} ${devices.root.mountPoint} ${devices.root.fsType} relatime,errors=remount-ro 0 1
${devices.swap.device} ${devices.swap.mountPoint} ${devices.swap.fsType} sw 0 0`;

  utils.bashWrite(file, text);
}

/**
 * hostname()
 * @param target 
 * @param options 
 */
async function hostname(target: string, options: any) {
  let file = `${target}/etc/hostname`;
  let text = options.hostname;

  utils.exec(`rm ${target}/etc/hostname`);
  fs.writeFileSync(file, text);
}

/**
 * resolvConf()
 * @param target 
 * @param options 
 */
async function resolvConf(target: string, options: any) {
  console.log(`tipo di resolv.con: ${options.netAddressType}`);
  if (options.netAddressType === "static") {
    let file = `${target}/etc/resolv.conf`;
    let text = `
search ${options.domain}
domain ${options.domain}
nameserver ${options.netDns}
nameserver 8.8.8.8
nameserver 8.8.4.4
`;
    utils.bashWrite(file, text);
  }
}

/**
 * 
 * auto lo
 * 
 * interfaces()
 * @param target 
 * @param options 
 */
async function interfaces(target: string, options: any) {
  if (options.netAddressType === "static") {
    let file = `${target}/etc/network/interfaces`;
    let text = `
auto lo
iface lo inet manual

auto ${options.netInterface}
iface ${options.netInterface} inet manual

auto vmbr0 
iface vmbr0 inet ${options.netAddressType} static
    address ${options.netAddress}
    netmask ${options.netMask}
    gateway ${options.netGateway}
    bridge-ports ${options.netInterface}
    bridge-stp off
    bridge-fd 0

auto loopback
iface loopback inet manual
    
auto manual
iface manual inet manual`;

    utils.bashWrite(file, text);
  }
}

/**
 * hosts()
 * @param target 
 * @param options 
 */
async function hosts(target: string, options: any) {
  let file = `${target}/etc/hosts`;
  let text = `127.0.0.1 localhost localhost.localdomain`;
  if (options.netAddressType === "static") {
    text += `
${options.netAddress} ${options.hostname} ${options.hostname}.${options.domain} pvelocalhost`;
  } else {
    text += `
127.0.1.1 ${options.hostname} ${options.hostname}.${options.domain}`;
  }
  text += `
# The following lines are desirable for IPv6 capable hosts
::1     ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
ff02::3 ip6-allhosts
`;

  utils.bashWrite(file, text);
}

/**
 * getIsLive()
 */
async function getIsLive(): Promise<string> {
  let result;
  result=await execute(`ls /lib/live|grep mount`);
  //result = await execute(`./scripts/is_live.sh`);
  return result;
}

/**
 * rsync()
 * @param target 
 */
async function rsync(target: string): Promise<void> {
  let cmd = "";
  cmd = `
  rsync -aq  \
  --progress \
  --delete-before  \
  --delete-excluded  \ ${filters} / ${target}`;
  console.log("hatching the egg...");
  shell.exec(cmd.trim(), {
    async: false
  });
}

async function mkfs(devices: IDevices): Promise<boolean> {
  let result = true;
  await execute(`mkfs -t ${devices.root.fsType} ${devices.root.device}`);
  await execute(`mkswap ${devices.swap.device}`);
  return result;
}

async function mount4target(target: string, devices: IDevices): Promise<boolean> {
  await execute(`mkdir ${target}`);
  await execute(`mount ${devices.root.device} ${target}`);
  await execute(`tune2fs -c 0 -i 0 ${devices.root.device}`);
  await execute(`rm -rf ${target}/lost+found`);

  return true;
}

async function tune2fs(target: string, devices: IDevices): Promise<boolean> {
  return true;
}

async function umount4target(target: string, devices: IDevices): Promise<boolean> {
  console.log("umount4target");

  await execute(`umount ${devices.root.device} ${target}`);
  await execute(`sleep 1`);

  //await execute(`rm -rf ${target}/home`);
  //await execute(`rm -rf ${target}/boot`);
  //await execute(`rm -rf ${target}`);
  return true;
}


async function diskPrepareNoLvm(device: string) {

  await execute(`parted --script ${device} mklabel msdos`);
  await execute(`parted --script --align optimal ${device} mkpart primary 1MiB 95%`);
  await execute(`parted --script ${device} set 1 boot on`);
  await execute(`parted --script --align optimal ${device} mkpart primary 95% 100%`);
  return true;
}

async function getDiskSize(device: string): Promise<number> {
  let response: string;
  let bytes: number;

  response = await execute(`parted -s ${device} unit b print free | grep Free | awk '{print $3}' | cut -d "M" -f1`);
  response = response.replace("B", "").trim();
  bytes = Number(response);
  return bytes;
}

/**
 * 
 * @param command 
 */
function execute(command: string): Promise<string> {
  return new Promise(function (resolve, reject) {
    var exec = require("child_process").exec;
    console.log(`executing: ${command}`);

    exec(command, function (error: string, stdout: string, stderr: string) {
      resolve(stdout);
    });
  });
}

/**
 * 
 * @param driveList 
 */
async function getOptions(driveList: string[]): Promise<any> {
  return new Promise(function (resolve, reject) {
    let questions: Array<Object> = [
      {
        type: "input",
        name: "username",
        message: "user name: ",
        default: "artisan"
      },
      {
        type: "input",
        name: "userfullname",
        message: "user full name: ",
        default: "artisan"
      },
      {
        type: "password",
        name: "userpassword",
        message: "Enter a password for the user: ",
        default: "evolution"
      },
      {
        type: "list",
        name: "autologin",
        message: "Did you want autolongin: ",
        choices: ["Yes", "No"],
        default: "Yes"
      },
      {
        type: "password",
        name: "rootpassword",
        message: "Enter a password for root: ",
        default: "evolution"
      },
      {
        type: "input",
        name: "hostname",
        message: "hostname: ",
        default: os.hostname
      },
      {
        type: "input",
        name: "domain",
        message: "domain name: ",
        default: "lan"
      },
      {
        type: "list",
        name: "netInterface",
        message: "Select the network interface: ",
        choices: ifaces
      },
      {
        type: "list",
        name: "netAddressType",
        message: "Select the network type: ",
        choices: ["dhcp", "static"],
        default: "dhcp"
      },
      {
        type: "input",
        name: "netAddress",
        message: "Insert IP address: ",
        default: "192.168.61.100",
        when: function (answers: any) {
          return answers.netAddressType === "static";
        }
      },
      {
        type: "input",
        name: "netMask",
        message: "Insert netmask: ",
        default: "255.255.255.0",
        when: function (answers: any) {
          return answers.netAddressType === "static";
        }
      },
      {
        type: "input",
        name: "netGateway",
        message: "Insert gateway: ",
        default: utils.netGateway(),
        when: function (answers: any) {
          return answers.netAddressType === "static";
        }
      },
      {
        type: "input",
        name: "netDns",
        message: "Insert DNS: ",
        default: utils.netDns(),
        when: function (answers: any) {
          return answers.netAddressType === "static";
        }
      },
      {
        type: "list",
        name: "installationDevice",
        message: "Select the installation disk: ",
        choices: driveList,
        default: driveList[0]
      },
      {
        type: "list",
        name: "fsType",
        message: "Select format type: ",
        choices: ["ext2", "ext3", "ext4"],
        default: "ext4"
      }
    ];

    inquirer.prompt(questions).then(function (options) {
      resolve(JSON.stringify(options));
    });
  });
}

var ifaces: string[] = fs.readdirSync("/sys/class/net/");



