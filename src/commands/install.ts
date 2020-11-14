/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Hatching from '../classes/hatching'

/**
 * Class Install
 */
export default class Install extends Command {
   static flags = {
      info: flags.help({ char: 'h' }),
      gui: flags.boolean({ char: 'g', description: 'use gui installer' }),
      minstall: flags.boolean({ char: 'm', description: 'use minstall installer' }),
      umount: flags.boolean({ char: 'u', description: 'umount devices' }),
      lvmremove: flags.boolean({
         char: 'l',
         description: 'remove lvm /dev/pve'
      }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }
   static description = 'system installater cli (the eggs became penguin)'

   static aliases = ['hatch']

   static examples = [`$ eggs install\npenguin's eggs installation\n`]

   /**
    * Execute
    */
   async run() {
      Utils.titles('install')

      const { flags } = this.parse(Install)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      let umount = false
      if (flags.umount) {
         umount = true
      }

      let lvmremove = false
      if (flags.lvmremove) {
         lvmremove = true
      }

      if (Utils.isRoot()) {
         if (Utils.isLive()) {
            if (flags.gui) {
               shx.exec('calamares')
            } else if (flags.minstall) {
               minstall()
            } else {
               const hatching = new Hatching()
               if (lvmremove) {
                  Utils.warning('Removing lvm')
                  await hatching.lvmRemove(verbose)
                  Utils.titles('install')
               }
               Utils.warning('Installing the system / spawning the egg...')
               await hatching.questions(verbose, umount)
            }
         } else {
            Utils.warning(`You are in an installed system!`)
         }
      }
   }
}


async function minstall() {
   shx.exec('rm /live -rf')
   shx.exec('mkdir /live/linux/home/demo -p')
   shx.exec('mkdir /live/aufs/boot -p')
   shx.exec('mkdir /live/boot-dev/antiX/ -p')
   shx.exec('ln -s /run/live/medium/live/filesystem.squashfs /live/boot-dev/antiX/linuxfs')

   // Creazione delle partizioni di mount
   shx.exec('mkdir /mnt/antiX/ -p')
   shx.exec('mkdir /mnt/antiX/boot/efi -p')
   // shx.exec('mount --bind /boot/efi /mnt/antiX/boot/efi ')

   shx.exec('mkdir /mnt/antiX/proc -p')
   shx.exec('mount --bind /proc /mnt/antiX/proc ')

   shx.exec('mkdir /mnt/antiX/sys -p')
   shx.exec('mount --bind /sys /mnt/antiX/sys ')

   shx.exec('mkdir /mnt/antiX/dev -p')
   shx.exec('mount --bind /dev /mnt/antiX/dev ')

   // shx.exec('/mnt/antiX/dev/shm -p')
   // shx.exec('/mnt/antiX/home -p')

   //shx.exec('minstall')
}

/*
I mount originali di MXLINUX

/dev/sr0 on /live/boot-dev type iso9660 (ro,relatime,nojoliet,check=s,map=n,blocksize=2048)
/live/boot-dev/antiX/linuxfs on /live/linux type squashfs (ro,relatime)
tmpfs on /live/aufs-ram type tmpfs (rw,noatime,size=1589248k)
overlay on / type overlay (rw,relatime,lowerdir=/live/linux,upperdir=/live/aufs-ram/upper,workdir=/live/aufs-ram/work)
tmpfs on /media type tmpfs (rw,noatime,size=10240k)
tmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,noatime,size=204268k,mode=755)
tmpfs on /live type tmpfs (rw,noatime,size=10240k,mode=755)
tmpfs on /tmp type tmpfs (rw,noatime)
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
sys on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)
devtmpfs on /dev type devtmpfs (rw,relatime,size=1015084k,nr_inodes=253771,mode=755)
devpts on /dev/pts type devpts (rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=000)
overlay on /live/aufs type overlay (rw,relatime,lowerdir=/live/linux,upperdir=/live/aufs-ram/upper,workdir=/live/aufs-ram/work)
tmpfs on /etc/live/config type tmpfs (rw,noatime,size=10240k,mode=755)
tmpfs on /etc/live/bin type tmpfs (rw,noatime,size=10240k,mode=755)
tmpfs on /run/lock type tmpfs (rw,nosuid,nodev,noexec,relatime,size=5120k)
pstore on /sys/fs/pstore type pstore (rw,relatime)
tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev,noexec,relatime,size=408520k)
rpc_pipefs on /run/rpc_pipefs type rpc_pipefs (rw,relatime)
cgroup on /sys/fs/cgroup type tmpfs (rw,relatime,size=12k,mode=755)
systemd on /sys/fs/cgroup/systemd type cgroup (rw,nosuid,nodev,noexec,relatime,release_agent=/run/cgmanager/agents/cgm-release-agent.systemd,name=systemd)
tmpfs on /run/user/1000 type tmpfs (rw,nosuid,nodev,relatime,size=204264k,mode=700,uid=1000,gid=1000)
gvfsd-fuse on /run/user/1000/gvfs type fuse.gvfsd-fuse (rw,nosuid,nodev,relatime,user_id=1000,group_id=1000)
*/

/*
I mount di penguins-eggs

sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
udev on /dev type devtmpfs (rw,nosuid,relatime,size=1985720k,nr_inodes=496430,mode=755)
devpts on /dev/pts type devpts (rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=000)
tmpfs on /run type tmpfs (rw,nosuid,noexec,relatime,size=404116k,mode=755)
/dev/sr0 on /run/live/medium type iso9660 (ro,noatime,nojoliet,check=s,map=n,blocksize=2048)
/dev/loop0 on /run/live/rootfs/filesystem.squashfs type squashfs (ro,noatime)
tmpfs on /run/live/overlay type tmpfs (rw,noatime,size=2020564k,mode=755)
overlay on / type overlay (rw,noatime,lowerdir=/run/live/rootfs/filesystem.squashfs/,upperdir=/run/live/overlay/rw,workdir=/run/live/overlay/work)
tmpfs on /usr/lib/live/mount type tmpfs (rw,nosuid,noexec,relatime,size=404116k,mode=755)
/dev/sr0 on /usr/lib/live/mount/medium type iso9660 (ro,noatime,nojoliet,check=s,map=n,blocksize=2048)
/dev/loop0 on /usr/lib/live/mount/rootfs/filesystem.squashfs type squashfs (ro,noatime)
tmpfs on /usr/lib/live/mount/overlay type tmpfs (rw,noatime,size=2020564k,mode=755)
tmpfs on /run/lock type tmpfs (rw,nosuid,nodev,noexec,relatime,size=5120k)
pstore on /sys/fs/pstore type pstore (rw,relatime)
tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev,noexec,relatime,size=808220k)
tmpfs on /tmp type tmpfs (rw,nosuid,nodev,relatime)
rpc_pipefs on /run/rpc_pipefs type rpc_pipefs (rw,relatime)
cgroup on /sys/fs/cgroup type tmpfs (rw,relatime,size=12k,mode=755)
systemd on /sys/fs/cgroup/systemd type cgroup (rw,nosuid,nodev,noexec,relatime,release_agent=/run/cgmanager/agents/cgm-release-agent.systemd,name=systemd)
tmpfs on /run/user/1000 type tmpfs (rw,nosuid,nodev,relatime,size=404112k,mode=700,uid=1000,gid=1000)
gvfsd-fuse on /run/user/1000/gvfs type fuse.gvfsd-fuse (rw,nosuid,nodev,relatime,user_id=1000,group_id=1000)
/dev/sda1 on /media/sda1 type ext4 (rw,relatime)
udev on /media/sda1/dev type devtmpfs (rw,nosuid,relatime,size=1985720k,nr_inodes=496430,mode=755)
proc on /media/sda1/proc type proc (rw,nosuid,nodev,noexec,relatime)
sysfs on /media/sda1/sys type sysfs (rw,nosuid,nodev,noexec,relatime)
*/
