import { version, name, author, mail, homepage } from "../../package.json";

("use strict");
//import os from "os";
import fs from "fs";
//import ip from "ip";
//import network from "network";
import utils from "./utils.js";

class Netboot {
  constructor(
    homeDir,
    distroName,
    clientUserFullName,
    clientUserName,
    clientPassword
  ) {
    this.fsDir = homeDir + `${distroName}/fs`;
    this.distroName = distroName;

    this.clientUserFullName = clientUserFullName;
    this.clientUserName = clientUserName;
    this.clientPassword = clientPassword;
    this.clientIpAddress = "127.0.1.1";
    this.kernelVer = utils.kernerlVersion();
    this.netDeviceName = utils.netDeviceName();
    this.netBootServer = utils.netBootServer();
    this.netDeviceName = utils.netDeviceName();
    this.netDns = utils.netDns();
    this.netGateway = utils.netGateway();
    this.netDomainName = utils.netDomainName();
    this.netNetmask = utils.netNetmask();
    this.net = utils.net(this.netBootServer, this.netNetmask);
    this.tftpRoot = `${homeDir}${distroName}/pxe`;
  }

  show() {
    console.log("eggs: incubator netboot parameters ");
    console.log(">>> kernelVer: " + this.kernelVer);
    console.log(">>> netBootServer: " + this.netBootServer);
    console.log(">>> netDeviceName: " + this.netDeviceName);
    console.log(">>> netDns: " + this.netDns);
    console.log(">>> netGateway: " + this.netGateway);
    console.log(">>> netDomainName: " + this.netDomainName);
    console.log(">>> netNetmask: " + this.netNetmask);
    console.log(">>> net: " + utils.net(this.netBootServer, this.netNetmask));
  }

  create() {
    console.log("==========================================");
    console.log("Incubator netboot: create");
    console.log("==========================================");
    if (!fs.existsSync(this.tftpRoot)) {
      utils.exec(`mkdir -p ${this.tftpRoot}`);
    }
    let file = `${this.tftpRoot}/index.html`;
    let text = `
<html>
<title>${name} version ${version} ${utils.date4label()}</title>
<body>
<h1> ${name} </h1>
<h2>Version ${version} created ${utils.date4label()} </h2>
<img src="eggs.png">
</body>
</html>`;
    fs.writeFileSync(file, text);
  }

  erase() {
    console.log("==========================================");
    console.log("Incubator netboot: erase");
    console.log("==========================================");
    utils.exec(`rm -rf ${this.tftpRoot}`);
  }

  vmlinuz() {
    utils.exec(`mkdir -p ${this.tftpRoot}/${this.distroName}`);
    console.log(`### Copia di vmlinuz-${this.kernelVer} ###`);
    utils.exec(
      `cp /boot/vmlinuz-${this.kernelVer}  ${this.tftpRoot}/${this.distroName}`
    );
    utils.exec(`chmod -R 777  ${this.tftpRoot}`);
  }

  initramfs() {
    console.log(`### creazione initramfs ###`);

    let conf = `/etc/initramfs-tools/initramfs.conf`;
    let initrdFile = `/tmp/initrd.img-${this.kernelVer}`;

    let search = "MODULES=most";
    let replace = "MODULES=netboot";
    utils.sr(conf, search, replace);

    search = "BOOT=local";
    replace = "BOOT=nfs";
    utils.sr(conf, search, replace);

    utils.exec(`mkinitramfs -o /tmp/initrd.img-${this.kernelVer}`);

    console.log(`### Copia di initrd.img-${this.kernelVer} ###`);
    utils.exec(`cp ${initrdFile}  ${this.tftpRoot}/${this.distroName}`);
    console.log(`### file initramfs ###`);
  }

  pxelinux() {
    utils.exec(`mkdir -p ${this.tftpRoot}/pxelinux.cfg`);
    let file = `${this.tftpRoot}/pxelinux.cfg/default`;
    let text = `# Generated by penguins-eggs
DEFAULT vesamenu.c32
TIMEOUT 600
ONTIMEOUT BootLocal
PROMPT 0
KBDMAP it.kbd
DISPLAY display.txt
SAY Uso la tastiera e locale per italiano.
MENU TITLE NETBOOT ${name} ${version} ${utils.date4label()}
MENU BACKGROUND eggs.png

LABEL
MENU DEFAULT
MENU LABEL ${this.distroName} live squash
KERNEL live/vmlinuz
APPEND initrd=live/initrd.img boot=live fetch=http://${this.netBootServer}/live/filesystem.squashfs
TEXT HELP
Distro live: ${this.distroName} squashfs, da http://${this.netBootServer}
ENDTEXT

LABEL
MENU LABEL ${this.distroName} live iso
KERNEL memdisk
APPEND initrd=penguin_2017-10-18_1941-02.iso
TEXT HELP
Distro live: ${this.distroName} immagine iso, da http://${this.netBootServer}
ENDTEXT

# LABEL
# MENU LABEL ${this.distroName} NFS
# KERNEL ${this.distroName}/vmlinuz-${this.kernelVer}
# APPEND root=/dev/nfs initrd=${this.distroName}/initrd.img-${this.kernelVer} nfsroot=${this.netBootServer}:${this.fsDir} ip=dhcp rw
# TEXT HELP
#   Distro: ${this.distroName} avviata con NSF
# ENDTEXT


LABEL
MENU LABEL Boot from https://netboot.xyz
  KERNEL memdisk
  INITRD netboot.xyz.iso
  APPEND iso raw
TEXT HELP
  Esegue il boot dal sito internet http://netboot.xyz
ENDTEXT

LABEL
MENU LABEL BootLocal
localboot 0
TEXT HELP
  Esegue il boot dal disco locale
ENDTEXT


include common.cfg`;

    utils.bashwrite(file, text);

    utils.exec(
      `cp ${utils.path()}/src/assets/netboot.xyz.iso  ${this
        .tftpRoot}/netboot.xyz.iso`
    );
    utils.exec(
      `cp ${utils.path()}/src/assets/netboot.xyz-undionly.kpxe ${this
        .tftpRoot}/.`
    );
    utils.exec(
      `cp ${utils.path()}/src/assets/netboot.xyz.kpxe ${this.tftpRoot}/.`
    );
    utils.exec(`cp ${utils.path()}/src/assets/eggs.png ${this.tftpRoot}/.`);
    utils.exec(`ln -s ${this.tftpRoot}/../${this.distroName}*.iso ${this.tftpRoot}/.`);
    utils.exec(`ln -s ${this.tftpRoot}/../iso/live ${this.tftpRoot}/.`);

    utils.exec(`ln -s /usr/lib/PXELINUX/pxelinux.0  ${this.tftpRoot}/.`);
    utils.exec(`ln -s /usr/lib/PXELINUX/lpxelinux.0  ${this.tftpRoot}/.`);

    utils.exec(
      `ln -s /usr/lib/syslinux/modules/bios/vesamenu.c32 ${this.tftpRoot}/.`
    );
    utils.exec(
      `ln -s /usr/lib/syslinux/modules/bios/ldlinux.c32 ${this.tftpRoot}/.`
    );
    utils.exec(
      `ln -s  /usr/lib/syslinux/modules/bios/libcom32.c32 ${this.tftpRoot}/.`
    );
    utils.exec(
      `ln -s /usr/lib/syslinux/modules/bios/libutil.c32 ${this.tftpRoot}/.`
    );
    utils.exec(`ln -s /usr/lib/syslinux/memdisk ${this.tftpRoot}/.`);
  }

  exports() {
    let file = `/etc/exports`;
    let text = `${this.fsDir} ${this.net}/${this
      .netNetmask}(rw,no_root_squash,async,no_subtree_check)
# >>> Attenzione NON lasciare spazi tra le opzioni nfs <<<`;

    utils.bashwrite(file, text);
  }

  dnsmasq() {
    let file = `/etc/dnsmasq.conf`;
    let text = `
interface=${this.netDeviceName}
domain=lan
dhcp-range=${this.net}, proxy, ${this.netNetmask}
pxe-service=x86PC, "Eggs and penguins...", pxelinux
# enable-tftp
port=0
tftp-root=${this.tftpRoot}
# IF dhcp-match=set:ipxe,175 THEN
dhcp-match=set:ipxe,175 # iPXE sends a 175 option.
      dhcp-boot=tag:!ipxe,netboot.xyz.kpxe
#ELSE
      #dhcp-boot=http://${this.netBootServer}/lpxelinux.0
      dhcp-boot=http://${this.netBootServer}/netboot.xyz-undionly.kpxe
# ENDIF`;

    utils.bashwrite(file, text);
  }

  install() {
    utils.exec(`apt-get update`);
    utils.exec(
      `apt-get install nfs-kernel-server dnsmasq syslinux pxelinux -y`
    );
  }

  purge() {
    utils.exec(
      `apt-get remove --purge nfs-kernel-server dnsmasq syslinux pxelinux --purge -y`
    );
  }
}

export default Netboot;
