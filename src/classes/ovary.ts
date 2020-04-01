/* eslint-disable no-console */
/**
 * penguins-eggs: ovary.ts VERSIONE DEBIAN-LIVE
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

// packages
import fs = require('fs')
import path = require('path')
import os = require('os')
import ini = require('ini')
import shx = require('shelljs')
import pjson = require('pjson')
import chalk = require('chalk')

// interfaces
import { IDistro, IOses, IPackage } from '../interfaces'

// libraries
const exec = require('../lib/utils').exec

// classes
import Utils from './utils'
import Calamares from './calamares/calamares-settings'
import Oses from './oses'
import Prerequisites from '../commands/prerequisites'
import { IWorkDir } from '../interfaces/i-workdir'

/**
 * Ovary:
 */
export default class Ovary {
  app = {} as IPackage

  distro = {} as IDistro

  work_dir = {} as IWorkDir

  oses = {} as Oses

  iso = {} as IOses

  eggName = ''

  calamares = {} as Calamares

  prerequisites = {} as Prerequisites

  i686 = false

  live = false

  force_installer = false

  reset_accounts = false

  debian_version = 10

  snapshot_dir = ''

  efi_work = ''

  config_file = '/etc/penguins-eggs.conf' as string

  gui_editor = '/usr/bin/joe' as string

  snapshot_excludes = '/usr/local/share/excludes/penguins-eggs-exclude.list' as string

  edit_boot_menu = false

  kernel_image = '' as string

  user_live = '' as string

  username_opt = '' as string

  pmount_fixed = false

  ssh_pass = false

  netconfig_opt = ''

  ifnames_opt = ''

  timezone_opt = ''

  initrd_image = '' as string

  make_efi = false

  make_isohybrid = false

  make_md5sum = false

  compression = '' as string

  mksq_opt = '' as string

  save_message = '' as string

  session_excludes = '' as string

  snapshot_basename = '' as string

  version = '' as string

  /**
   * Egg
   * @param compression
   */
  constructor(compression = '') {
    this.compression = compression

    this.app.author = 'Piero Proietti'
    this.app.homepage = 'https://github.com/pieroproietti/penguins-eggs'
    this.app.mail = 'piero.proietti@gmail.com'
    this.app.name = pjson.name as string
    this.app.version = pjson.version

    this.distro.name = os.hostname()
    this.distro.versionName = 'Emperor'
    this.distro.versionNumber = 'zero' // Utils.formatDate()
    this.distro.branding = 'eggs'
    this.distro.kernel = Utils.kernerlVersion()

    this.live = Utils.isLive()

    this.i686 = Utils.isi686()
    this.debian_version = Utils.getDebianVersion()
  }

  /**
  * inizializzazioni che non può essere messa nel constructor
  * a causa della necessità di async.
  * @returns {boolean} success
  */
  async fertilization(): Promise<boolean> {
    this.oses = new Oses()
    this.iso = this.oses.info(this.distro)

    if (this.loadSettings()){
      if (this.listFreeSpace()) {
        let answer = JSON.parse(await Utils.customConfirm(`Select yes to continue...`))
        if (answer.confirm === 'Yes') {
          return true
        }
      }
    }
    return false
  }

  /**
   * Load configuration from /etc/penguins-eggs.conf
   * @returns {boolean} Success
   */
  public async loadSettings(verbose = false): Promise<boolean> {
    let foundSettings: boolean

    const settings = ini.parse(fs.readFileSync(this.config_file, 'utf-8'))

    if (settings.General.snapshot_dir === '') {
      foundSettings = false
    } else {
      foundSettings = true
    }
    this.session_excludes = ''
    this.snapshot_dir = settings.General.snapshot_dir.trim()
    if (!this.snapshot_dir.endsWith('/')) {
      this.snapshot_dir += '/'
    }
    this.work_dir.path = this.snapshot_dir + 'work/'
    this.work_dir.pathIso = this.work_dir.path + 'iso'
    this.work_dir.lowerdir = this.work_dir.path + 'overlay/lowerdir'
    this.work_dir.upperdir = this.work_dir.path + 'overlay/upperdir'
    this.work_dir.workdir = this.work_dir.path + 'overlay/workdir'
    this.work_dir.merged = this.work_dir.path + 'merged'
    this.efi_work = this.work_dir.path + 'efi-work/'
    this.snapshot_excludes = settings.General.snapshot_excludes
    this.snapshot_basename = settings.General.snapshot_basename
    this.make_efi = settings.General.make_efi === "yes"
    this.make_isohybrid = settings.General.make_isohybrid === "yes"
    this.make_md5sum = settings.General.make_md5sum === "yes"
    if (this.compression === '') {
      this.compression = settings.General.compression
    }
    this.mksq_opt = settings.General.mksq_opt
    this.edit_boot_menu = settings.General.edit_boot_menu === "yes"
    this.gui_editor = settings.General.gui_editor
    this.force_installer = settings.General.force_installer === "yes"
    this.reset_accounts = settings.General.reset_accounts === "yes"
    this.kernel_image = settings.General.kernel_image
    this.initrd_image = settings.General.initrd_image
    this.netconfig_opt = settings.General.netconfig_opt
    if (this.netconfig_opt === undefined) {
      this.netconfig_opt = ''
    }
    this.ifnames_opt = settings.General.ifnames_opt
    if (this.ifnames_opt === undefined) {
      this.ifnames_opt = ''
    }
    this.pmount_fixed = settings.General.pmount_system === "yes"
    this.ssh_pass = settings.General.ssh_pass === "yes"

    /**
     * Use the login name set in the config file. If not set, use the primary 
     * user's name. If the name is not "user" then add boot option. ALso use
     * the same username for cleaning geany history.
     */
    this.user_live = settings.General.user_live

    if (this.user_live === undefined || this.user_live === '') {
      this.user_live = shx.exec(`awk -F":" '/1000:1000/ { print $1 }' /etc/passwd`, {silent: true}).stdout.trim()
      if (this.user_live === '') {
        this.user_live = 'live'
      }
    }
    this.username_opt = `username=${this.user_live}`

    const timezone = shx.exec('cat /etc/timezone', { silent: true }).stdout.trim()
    this.timezone_opt = `timezone=${timezone}`
    return foundSettings
  }

  /**
   * showSettings
   */
  public async showSettings() {
    console.log(`application_nane:  ${this.app.name} ${this.app.version}`)
    console.log(`config_file:       ${this.config_file}`)
    console.log(`snapshot_dir:      ${this.snapshot_dir}`)
    console.log(`snapshot_exclude:  ${this.snapshot_excludes}`)
    if (this.snapshot_basename === 'hostname') {
      console.log(`snapshot_basename: ${os.hostname} (hostname)`)
    } else {
      console.log(`snapshot_basename: ${this.snapshot_basename}`)
    }
    console.log(`work_dir:          ${this.work_dir.path}`)
    console.log(`efi_work:          ${this.efi_work}`)
    console.log(`make_efi:          ${this.make_efi}`)
    console.log(`make_md5sum:       ${this.make_md5sum}`)
    console.log(`make_isohybrid:    ${this.make_isohybrid}`)
    console.log(`compression:       ${this.compression}`)
    console.log(`mksq_opt:          ${this.mksq_opt}`)
    console.log(`edit_boot_menu:    ${this.edit_boot_menu}`)
    console.log(`gui_editor:        ${this.gui_editor}`)
    console.log(`force_installer:   ${this.force_installer}`)
    console.log(`reset_accounts:    ${this.reset_accounts}`)
    console.log(`kernel_image:      ${this.kernel_image}`)
    console.log(`user_live:         ${this.user_live}`)
    console.log(`initrd_image:      ${this.initrd_image}`)
    console.log(`netconfig_opt:     ${this.netconfig_opt}`)
    console.log(`ifnames_opt:       ${this.ifnames_opt}`)
    console.log(`pmount_fixed:      ${this.pmount_fixed}`)
    console.log(`ssh_pass:          ${this.ssh_pass}`)
    if (this.make_efi) {
      if (!Utils.packageIsInstalled('grub-efi-amd64')) {
        console.log(chalk.yellow('You choose to create an UEFI image, but miss to install grub-ef-amd64 package.'))
        console.log(chalk.yellow('Please install it before to create an UEFI image:'))
        console.log(chalk.green('sudo apt install grub-efi-amd64'))
        this.make_efi = false
      }
      if (!Utils.packageIsInstalled('dosfstools')) {
        console.log(chalk.yellow('You choose to create an UEFI image, but miss to install dosfstools package.'))
        console.log(chalk.yellow('Please install it before to create an UEFI image:'))
        console.log(chalk.green('sudo apt install dosfstools'))
        this.make_efi = false
      }
    }
  }

  /**
   * Calculate and show free space on the disk
   * @returns {void}
   */
  async listFreeSpace(): Promise<void> {
    const path: string = this.snapshot_dir // convert to absolute path
    if (!fs.existsSync(this.snapshot_dir)) {
      fs.mkdirSync(this.snapshot_dir)
    }
    /** Lo spazio usato da SquashFS non è stimabile da live
     * errore buffer troppo piccolo
     */
    const gb = 1048576
    let spaceUsed = 0
    let spaceAvailable = 0
    if (!Utils.isLive()) {
      spaceUsed = Number(shx.exec(`df /home | /usr/bin/awk 'NR==2 {print $3}'`, {silent: true}).stdout)
      console.log(`Disk used space: ${Math.round(Utils.getUsedSpace() / gb * 10) / 10} GB`)
    }
    
    spaceAvailable = Number(shx.exec(`df "${path}" | /usr/bin/awk 'NR==2 {print $4}'`, { silent: true }).stdout.trim())
    console.log(`Space available: ${Math.round(spaceAvailable / gb * 10) / 10} GB`)
    console.log(`There are ${Utils.getSnapshotCount(this.snapshot_dir)} snapshots taking ${Math.round(Utils.getSnapshotSize()/ gb * 10)/10} GB of disk space.`)
    console.log()
    
    if (spaceAvailable > gb * 3) {
      console.log(chalk.cyanBright('The free space should  be sufficient to hold the'))
      console.log(chalk.cyanBright('compressed data from / and /home'))
    } else {
      console.log(chalk.redBright('The free space should be insufficient')+'.')
      console.log()
      console.log('If necessary, you can create more available space')
      console.log('by removing previous  snapshots and saved copies:')
    }
    console.log('')
  }

  /**
   *
   * @param basename
   */
  async produce(basename = '', verbose = false) {
    let echo = Utils.setEcho(verbose)

    if (!fs.existsSync(this.snapshot_dir)) {
      shx.mkdir('-p', this.snapshot_dir)
    }

    if (basename !== '') {
      this.distro.name = basename
    }

    if (await Utils.isLive()) {
      console.log(chalk.red('>>> eggs: This is a live system! An egg cannot be produced from an egg!'))
    } else {
      if (verbose) {
        console.log(`Produce egg ${this.distro.name}`)
      }
      await this.liveCreateStructure(verbose)
      await this.calamaresConfigure(verbose)
      await this.isoCreateStructure(verbose)
      await this.isolinuxPrepare(verbose)
      await this.isoStdmenuCfg(verbose)
      await this.isolinuxCfg(verbose)
      await this.isoMenuCfg()
      await this.copyKernel()
      if (this.make_efi) {
        await this.makeEfi(verbose)
      }
      await this.bindLiveFs(verbose)
      await this.makeLiveHome(verbose)
      await this.editLiveFs(verbose)
      await this.editBootMenu(verbose)
      // await this.addDebianRepo()
      await this.makeSquashFs(verbose)
      if (this.make_efi) {
        await this.editEfi(verbose)
      }
      await this.makeIsoImage(verbose)
      await this.uBindLiveFs(verbose)
    }
  }

  /**
   * Crea la struttura della workdir
   */
  async liveCreateStructure(verbose = false) {
    if (verbose) {
      console.log('Overy: liveCreateStructure')
    }
    if (!fs.existsSync(this.work_dir.lowerdir)) {
      shx.mkdir('-p', this.work_dir.lowerdir)
    }
    if (!fs.existsSync(this.work_dir.upperdir)) {
      shx.mkdir('-p', this.work_dir.upperdir)
    }
    if (!fs.existsSync(this.work_dir.workdir)) {
      shx.mkdir('-p', this.work_dir.workdir)
    }
    if (!fs.existsSync(this.work_dir.merged)) {
      shx.mkdir('-p', this.work_dir.merged)
    }
  }

  /**
   * calamaresConfigura
   * Installa calamares se force_installer=yes e lo configura
   */
  async  calamaresConfigure(verbose = false) {
    if (verbose) {
      console.log('ovary: calamaresConfigure')
    }
    // Se force_installer e calamares non è installato
    if (this.force_installer && !Utils.packageIsInstalled('calamares')) {
      shx.exec(`apt-get update`, { async: false })
      shx.exec(`apt-get install --yes \
              calamares \
              calamares-settings-debian`, { async: false })
    }

    // Se calamares è installato allora lo configura
    if (Utils.packageIsInstalled('calamares')) {
      this.calamares = new Calamares(this.distro, this.iso, verbose)
      await this.calamares.config()
    }
  }


  /**
   * editLiveFs
   * - Truncate logs, remove archived log
   * - Allow all fixed drives to be mounted with pmount
   * - Enable or disable password login trhough ssh for users (not root)
   * - Create an empty /etc/fstab
   * - Blanck /etc/machine-id
   * - Add some basic files to /dev
   * - Clear configs from /etc/network/interfaces, wicd and NetworkManager and netman
   */
  async editLiveFs(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('ovary: editLiveFs')
    }

    // sudo systemctl disable wpa_supplicant 

    // Truncate logs, remove archived logs.
    let cmd = `find ${this.work_dir.merged}/var/log -name "*gz" -print0 | xargs -0r rm -f`
    await exec(cmd, echo)
    cmd = `find ${this.work_dir.merged}/var/log/ -type f -exec truncate -s 0 {} \\;`
    await exec(cmd, echo)

    // Allow all fixed drives to be mounted with pmount
    if (this.pmount_fixed) {
      if (fs.existsSync(`${this.work_dir.merged}/etc/pmount.allow`))
        await exec(`sed -i 's:#/dev/sd\[a-z\]:/dev/sd\[a-z\]:' ${this.work_dir.merged}/pmount.allow`, echo)
    }

    // Enable or disable password login through ssh for users (not root)
    // Remove obsolete live-config file
    if (fs.existsSync(`${this.work_dir.merged}lib/live/config/1161-openssh-server`)) {
      await exec(`rm -f "$work_dir"/myfs/lib/live/config/1161-openssh-server`, echo)
    }
    if (fs.existsSync(`${this.work_dir.merged}/etc/ssh/sshd_config`)){
      await exec(`sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' ${this.work_dir.merged}/etc/ssh/sshd_config`, echo)
      if (this.ssh_pass) {
        await exec(`sed -i 's|.*PasswordAuthentication.*no|PasswordAuthentication yes|' ${this.work_dir.merged}/etc/ssh/sshd_config`, echo)
      } else {
        await exec(`sed -i 's|.*PasswordAuthentication.*yes|PasswordAuthentication no|' ${this.work_dir.merged}/etc/ssh/sshd_config`, echo)
      }
    }


    /**
     * /etc/fstab should exist, even if it's empty,
     * to prevent error messages at boot
     */
     await exec(`touch ${this.work_dir.merged}/etc/fstab`, echo)

    /**
     * Blank out systemd machine id. If it does not exist, systemd-journald
     * will fail, but if it exists and is empty, systemd will automatically
     * set up a new unique ID.
     */
    if (fs.existsSync(`${this.work_dir.merged}/etc/machine-id`)) {
      await exec(`touch ${this.work_dir.merged}/etc/machine-id`, echo)
      Utils.write(`${this.work_dir.merged}/etc/machine-id`, `:`)
    }


    /**
     * add some basic files to /dev
     */
    await exec(`mknod -m 622 ${this.work_dir.merged}/dev/console c 5 1`, echo)
    await exec(`mknod -m 666 ${this.work_dir.merged}/dev/null c 1 3`, echo)
    await exec(`mknod -m 666 ${this.work_dir.merged}/dev/zero c 1 5`, echo)
    await exec(`mknod -m 666 ${this.work_dir.merged}/dev/ptmx c 5 2`, echo)
    await exec(`mknod -m 666 ${this.work_dir.merged}/dev/tty c 5 0`, echo)
    await exec(`mknod -m 444 ${this.work_dir.merged}/dev/random c 1 8`, echo)
    await exec(`mknod -m 444 ${this.work_dir.merged}/dev/urandom c 1 9`, echo)
    await exec(`chown -v root:tty ${this.work_dir.merged}/dev/{console,ptmx,tty}`, echo)

    await exec(`ln -sv /proc/self/fd ${this.work_dir.merged}/dev/fd`, echo)
    await exec(`ln -sv /proc/self/fd/0 ${this.work_dir.merged}/dev/stdin`, echo)
    await exec(`ln -sv /proc/self/fd/1 ${this.work_dir.merged}/dev/stdout`, echo)
    await exec(`ln -sv /proc/self/fd/2 ${this.work_dir.merged}/dev/stderr`, echo)
    await exec(`ln -sv /proc/kcore ${this.work_dir.merged}/dev/core`, echo)
    await exec(`mkdir -v ${this.work_dir.merged}/dev/shm`, echo)
    await exec(`mkdir -v ${this.work_dir.merged}/dev/pts`, echo)
    await exec(`chmod 1777 ${this.work_dir.merged}/dev/shm`, echo)

    /**
     * Clear configs from /etc/network/interfaces, wicd and NetworkManager
     * and netman, so they aren't stealthily included in the snapshot.
    */
    await exec(`touch ${this.work_dir.merged}/etc/network/interfaces`, echo)
    Utils.write(`${this.work_dir.merged}/etc/network/interfaces`, `auto lo\niface lo inet loopback`)
    await exec(`rm -f ${this.work_dir.merged}/var/lib/wicd/configurations/*`, echo)
    await exec(`rm -f ${this.work_dir.merged}/etc/wicd/wireless-settings.conf`, echo)
    await exec(`rm -f ${this.work_dir.merged}/etc/NetworkManager/system-connections/*`, echo)
    await exec(`rm -f ${this.work_dir.merged}/etc/network/wifi/*`, echo)
    // Ho disabilitato l'attesa per la rete
    // systemctl mask systemd-networkd-wait-online.service
    // systemctl unmask systemd-networkd-wait-online.service
    // systemctl disable systemd-time-wait-sync
    
    /**
     * Andiamo a fare pulizia in /etc/network/:
     * if-down.d  if-post-down.d  if-pre-up.d  if-up.d  interfaces  interfaces.d
    */
    const cleanDirs = ['if-down.d', 'if-post-down.d', 'if-pre-up.d', 'if-up.d', 'interfaces.d']
    let cleanDir = ''
    for (cleanDir of cleanDirs) {
      await exec(`rm -f ${this.work_dir.merged}/etc/network/${cleanDir}/wpasupplicant`, echo)
    }
  }

  /**
   * editBootMenu
   */
  async editBootMenu(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('ovary: editBootMenu')
    }

    let cmd = ''
    if (this.edit_boot_menu) {
      cmd = `${this.gui_editor} ${this.work_dir.path}/iso/boot/isolinux/menu.cfg`
      await exec(cmd, echo)
      if (this.make_efi) {
        cmd = `${this.gui_editor} ${this.work_dir.path}/iso/boot/grub/grub.cfg`
        await exec(cmd, echo)
      }
    }
  }

  /**
   *  async isoCreateStructure() {
   */
  async isoCreateStructure(verbose = false) {
    if (verbose) {
      console.log('ovary: createStructure')
    }

    if (!fs.existsSync(this.work_dir.pathIso)) {
      shx.mkdir(`-p`, `${this.work_dir.pathIso}/boot/grub/x86_64-efi`)
      shx.mkdir(`-p`, `${this.work_dir.pathIso}/efi/boot`)
      shx.mkdir(`-p`, `${this.work_dir.pathIso}/isolinux`)
      shx.mkdir(`-p`, `${this.work_dir.pathIso}/live`)
      // shx.mkdir(`-p`, `${this.work_dir.pathIso}/boot/syslinux`)
    }
  }

  async isolinuxPrepare(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('ovary: isolinuxPrepare')
    }

    const isolinuxbin = `${this.iso.isolinuxPath}isolinux.bin`
    const vesamenu = `${this.iso.syslinuxPath}vesamenu.c32`

    await exec(`rsync -a ${this.iso.syslinuxPath}chain.c32 ${this.work_dir.pathIso}/isolinux/`, echo)
    await exec(`rsync -a ${this.iso.syslinuxPath}ldlinux.c32 ${this.work_dir.pathIso}/isolinux/`, echo)
    await exec(`rsync -a ${this.iso.syslinuxPath}libcom32.c32 ${this.work_dir.pathIso}/isolinux/`, echo)
    await exec(`rsync -a ${this.iso.syslinuxPath}libutil.c32 ${this.work_dir.pathIso}/isolinux/`, echo)
    await exec(`rsync -a ${isolinuxbin} ${this.work_dir.pathIso}/isolinux/`, echo)
    await exec(`rsync -a ${vesamenu} ${this.work_dir.pathIso}/isolinux/`, echo)
  }

  /**
   * 
   * @param verbose 
   */
  async isoStdmenuCfg(verbose = false) {
    if (verbose) {
      console.log('ovary: isoStdmenuCfg')
    }

    const file = `${this.work_dir.pathIso}/isolinux/stdmenu.cfg`
    const text = `menu background splash.png
    menu color title	* #FFFFFFFF *
    menu color border	* #00000000 #00000000 none
    menu color sel		* #ffffffff #76a1d0ff *
    menu color hotsel	1;7;37;40 #ffffffff #76a1d0ff *
    menu color tabmsg	* #ffffffff #00000000 *
    menu color help		37;40 #ffdddd00 #00000000 none
    # XXX When adjusting vshift, take care that rows is set to a small
    # enough value so any possible menu will fit on the screen,
    # rather than falling off the bottom.
    menu vshift 8
    menu rows 8
    # The help line must be at least one line from the bottom.
    menu helpmsgrow 14
    # The command line must be at least one line from the help line.
    menu cmdlinerow 16
    menu timeoutrow 16
    menu tabmsgrow 18
    menu tabmsg Press ENTER to boot or TAB to edit a menu entry`

    Utils.write(file, text)
  }

  /**
   * create isolinux.cfg
   * @param verbose 
   */
  isolinuxCfg(verbose = false) {
    if (verbose) {
      console.log('ovary: isolinuxCfg')
    }
    const file = `${this.work_dir.pathIso}/isolinux/isolinux.cfg`
    const text = `# D-I config version 2.0
# search path for the c32 support libraries (libcom32, libutil etc.)
path 
include menu.cfg
default vesamenu.c32
prompt 0
timeout 200\n`
    Utils.write(file, text)
  }

  async isoMenuCfg(verbose = false) {
    /**
     *
    * debconf                 allows one to apply arbitrary preseed files placed on the live media or an http/ftp server.
    * hostname                configura i file /etc/hostname e /etc/hosts.
    * user-setup              aggiunge un account per l'utente live.
    * sudo                    concede i privilegi per sudo all'utente live.
    * locales                 configura la localizzazione.
    * locales-all             configura locales-all.
    * tzdata                  configura il file /etc/timezone.
    * gdm3                    configura il login automatico per gdm3.
    * kdm                     configura il login automatico per kdm.
    * lightdm                 configura il login automatico per lightdm.
    * lxdm                    configura il login automatico per lxdm.
    * nodm                    configura il login automatico per nodm.
    * slim                    configura il login automatico per slim.
    * xinit                   configura il login automatico con xinit.
    * keyboard-configuration  configura la tastiera.
    * systemd                 configura il login automatico con systemd.
    * sysvinit                configura sysvinit.
    * sysv-rc                 configura sysv-rc disabilitando i servizi elencati.
    * login                   disabilita lastlog.
    * apport                  disabilita apport.
    * gnome-panel-data        disabilita il pulsante di blocco dello schermo.
    * gnome-power-manager     disabilita l'ibernazione.
    * gnome-screensaver       disabilita lo screensaver che blocca lo schermo.
    * kaboom                  disabilita la procedura guidata di migrazione di KDE (squeeze e successive).
    * kde-services            disabilita i servizi di KDE non voluti (squeeze e successive).
    * policykit               concede i privilegi per l'utente tramite policykit.
    * ssl-cert                rigenera certificati ssl snake-oil.
    * anacron                 disabilita anacron.
    * util-linux              disabilita hwclock (parte di util-linux).
    * login                   disabilita lastlog.
    * xserver-xorg            configura xserver-xorg.
    * broadcom-sta            configura il driver per broadcom-sta WLAN.
    * openssh-server          ricrea le chiavi di openssh-server.
    * xfce4-panel             configura xfce4-panel con le impostazioni predefinite.
    * xscreensaver            disabilita lo screensaver che blocca lo schermo.
    * hooks                   allows one to run arbitrary commands from a file placed on the live media or an http/ftp server.
    *
    */

    const mpath = `${this.work_dir.pathIso}/isolinux/menu.cfg`
    const spath = `${this.work_dir.pathIso}/isolinux/splash.png`

    fs.copyFileSync(path.resolve(__dirname, '../../conf/isolinux.menu.cfg.template'), mpath)
    fs.copyFileSync(path.resolve(__dirname, '../../assets/penguins-eggs-splash.png'), spath)

    shx.sed('-i', '%custom-name%', this.distro.name, mpath)
    shx.sed('-i', '%kernel%', Utils.kernerlVersion(), mpath)
    shx.sed('-i', '%vmlinuz%', `/live${this.kernel_image}`, mpath)
    shx.sed('-i', '%initrd-img%', `/live${this.initrd_image}`, mpath)
    shx.sed('-i', '%username-opt%', this.username_opt, mpath)
    shx.sed('-i', '%netconfig-opt%', this.netconfig_opt, mpath)
    shx.sed('-i', '%timezone-opt%', this.timezone_opt, mpath)
  }

  /**
   * copy kernel
   */
  async copyKernel(verbose = false) {
    if (verbose) {
      console.log('ovary: liveKernel')
    }
    shx.cp(this.kernel_image, `${this.work_dir.pathIso}/live/`)
    shx.cp(this.initrd_image, `${this.work_dir.pathIso}/live/`)
  }


  /**
   * squashFs: crea in live filesystem.squashfs
   */
  async makeSquashFs(verbose = false) {
    let echo = { echo: false, ignore: false }
    if (verbose) {
      echo = { echo: true, ignore: false }
    }

    if (verbose) {
      console.log('ovary: makeSquashFs')
    }

    this.addRemoveExclusion(true, this.snapshot_dir /* .absolutePath() */)

    if (this.reset_accounts) {
      // exclude /etc/localtime if link and timezone not America/New_York
      if (shx.exec('/usr/bin/test -L /etc/localtime', { silent: true }) && shx.exec('cat /etc/timezone', { silent: true }) !== 'America/New_York') {
        this.addRemoveExclusion(true, '/etc/localtime')
      }
    }
    const compression = `-comp ${this.compression}`
    if (fs.existsSync(`${this.work_dir.pathIso}/live/filesystem.squashfs`)) {
      fs.unlinkSync(`${this.work_dir.pathIso}/live/filesystem.squashfs`)
    }
    let cmd = `mksquashfs ${this.work_dir.merged} ${this.work_dir.pathIso}/live/filesystem.squashfs ${compression} ${(this.mksq_opt === '' ? '' : ' ' + this.mksq_opt)} -wildcards -ef ${this.snapshot_excludes} ${this.session_excludes} `
    await exec(cmd, echo)
    // usr/bin/mksquashfs /.bind-root iso-template/antiX/linuxfs -comp ${this.compression} ${(this.mksq_opt === '' ? '' : ' ' + this.mksq_opt)} -wildcards -ef ${this.snapshot_excludes} ${this.session_excludes}`)
  }

  /**
   * Return the eggName with architecture and date
   * @param basename
   * @returns eggName
   */
  getFilename(basename = ''): string {
    let arch = 'x64'
    if (Utils.isi686()) {
      arch = 'i386'
    }
    if (basename === '') {
      basename = this.snapshot_basename
    }
    let isoName = `${basename}-${arch}_${Utils.formatDate(new Date())}`
    if (isoName.length >= 28) {
      isoName = isoName.substr(0, 28) // 28 +  4 .iso = 32 lunghezza max di volid
    }
    return `${isoName}.iso`
  }

  /**
   * Restituisce true per le direcory da montare con overlay
   * @param dir 
   */
  needOverlay(dir: string): boolean {
    // const excludeDirs = ['cdrom', 'dev', 'home', 'live', 'media', 'mnt', 'proc', 'run', 'sys', 'swapfile', 'tmp']
    const mountDirs = ['etc', 'var']
    let mountDir = ''
    let need = false
    for (mountDir of mountDirs) {
      if (mountDir === dir) {
        need = true
      }
    }
    return need
  }

  /**
   * Ritorna true se c'è bisogno della copia 
   * @param dir 
   */
  onlyMerged(dir: string): boolean {
    const noDirs = ['cdrom', 'dev', 'home', 'live', 'media', 'mnt', 'proc', 'run', 'sys', 'swapfile', 'tmp']
    let noDir = ''
    let need = true
    for (noDir of noDirs) {
      if (dir === noDir) {
        need = false
      }
    }
    return need
  }
  /**
    * Check if exist mx-snapshot in work_dir;
    * If respin mode remove all the users
    */
  async bindLiveFs(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('ovary: bindLiveFs')
    }

    const rootDirs = fs.readdirSync('/', { withFileTypes: true })
    let cmd = ''
    let ln = ''
    let dest = ''
    for (let dir of rootDirs) {
      if (dir.isDirectory()) {
        if (!(dir.name === 'lost+found')) {
          if (verbose) {
            console.log(`# ${dir.name} = directory`)
          }
          if (this.needOverlay(dir.name)) {
            // Creo il mountpoint lower e ci monto in ro dir.name
            await makeIfNotExist(`${this.work_dir.lowerdir}/${dir.name}`)
            await exec(`mount --bind --make-slave /${dir.name} ${this.work_dir.lowerdir}/${dir.name}`, echo)
            await exec(`mount -o remount,bind,ro ${this.work_dir.lowerdir}/${dir.name}`, echo)
            // Creo i mountpoint upper, work e merged e monto in merged rw
            await makeIfNotExist(`${this.work_dir.upperdir}/${dir.name}`, verbose)
            await makeIfNotExist(`${this.work_dir.workdir}/${dir.name}`, verbose)
            await makeIfNotExist(`${this.work_dir.merged}/${dir.name}`, verbose)
            await exec(`mount -t overlay overlay -o lowerdir=${this.work_dir.lowerdir}/${dir.name},upperdir=${this.work_dir.upperdir}/${dir.name},workdir=${this.work_dir.workdir}/${dir.name} ${this.work_dir.merged}/${dir.name}`, echo)
          } else {
            // Creo direttamente la dir.name in merged
            await makeIfNotExist(`${this.work_dir.merged}/${dir.name}`, verbose)
            if (this.onlyMerged(dir.name)) {
              await makeIfNotExist(`${this.work_dir.merged}/${dir.name}`, verbose)
              await exec(`mount --bind --make-slave /${dir.name} ${this.work_dir.merged}/${dir.name}`, echo)
              await exec(`mount -o remount,bind,ro ${this.work_dir.merged}/${dir.name}`, echo)
            }
          }
        }
      } else if (dir.isFile()) {
        if (verbose) {
          console.log(`# ${dir.name} = file`)
        }
        if (!(fs.existsSync(`${this.work_dir.merged}/${dir.name}`))) {
          await exec(`cp /${dir.name} ${this.work_dir.merged}`, echo)
        } else {
          if (verbose) {
            console.log(`# file esistente... skip`)
          }
        }
      } else if (dir.isSymbolicLink()) {
        if (verbose) {
          console.log(`# ${dir.name} = symbolicLink`)
        }
        if (!(fs.existsSync(`${this.work_dir.merged}/${dir.name}`))) {
          await exec(`cp -r /${dir.name} ${this.work_dir.merged}`, echo)
        } else {
          if (verbose) {
            console.log(`# SymbolicLink esistente... skip`)
          }
        }
      }
    }
  }

  /**
   * 
   */
  async uBindLiveFs(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('ovary: uBindLiveFs')
    }

    let cout = { code: 0, data: '' }
    // await exec(`/usr/bin/pkill mksquashfs; /usr/bin/pkill md5sum`, {echo: true})

    // this.work_dir.merged = `/home/eggs/work/debu7/merged` esistono
    // this.work_dir.lowerdir = `/home/eggs/work/debu7/lowerdir`
    if (fs.existsSync(this.work_dir.merged)) {
      const bindDirs = fs.readdirSync(this.work_dir.merged, { withFileTypes: true })
      for (let dir of bindDirs) {
        if (dir.isDirectory()) {
          if (verbose) {
            console.log(`# ${dir.name} = directory`)
          }
          if (this.needOverlay(dir.name)) {
            cout = await exec(`umount ${this.work_dir.merged}/${dir.name}`, echo)
            if (verbose) {
              console.log(`code: [${cout.code}] ${cout.data}`)
            }
            cout = await exec(`umount ${this.work_dir.lowerdir}/${dir.name}`, echo)
            if (verbose) {
              console.log(`code: [${cout.code}] ${cout.data}`)
            }
          } else if (this.onlyMerged(dir.name)) {
            cout = await exec(`umount ${this.work_dir.merged}/${dir.name}`, echo)
            if (verbose) {
              console.log(`code: [${cout.code}] ${cout.data}`)
            }
          }
          await exec(`rm ${this.work_dir.merged}/${dir.name} -rf`, echo)
          await exec(`rm ${this.work_dir.lowerdir}/${dir.name} -rf`, echo)
        } else if (dir.isFile()) {
          if (verbose) {
            console.log(`# ${dir.name} = file`)
          }
          await exec(`rm ${this.work_dir.merged}/${dir.name}`, echo)
        } else if (dir.isSymbolicLink()) {
          if (verbose) {
            console.log(`# ${dir.name} = symbolicLink`)
          }
          await exec(`rm ${this.work_dir.merged}/${dir.name}`, echo)
        }
      }
    }
  }

  /**
   * create la home per live
   * @param verbose 
   */
  async makeLiveHome(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('ovary: makeLiveHome')
    }


    const user: string = Utils.getPrimaryUser()

    // Copiamo i link su /usr/share/applications
    shx.cp(path.resolve(__dirname, '../../conf/grub.cfg.template'), `${this.work_dir.pathIso}/boot/grub/grub.cfg`)

    shx.cp(path.resolve(__dirname, `../../assets/penguins-eggs.desktop`), `/usr/share/applications/`)
    shx.cp(path.resolve(__dirname, `../../assets/eggs.png`), `/usr/share/icons/`)

    shx.cp(path.resolve(__dirname, `../../assets/dwagent-sh.desktop`), `/usr/share/applications/`)
    shx.cp(path.resolve(__dirname, `../../assets/assistenza-remota.png`), `/usr/share/icons/`)

    // creazione della home per user live
    shx.cp(`-r`, `/etc/skel/.`, `${this.work_dir.merged}/home/${user}`)
    await exec(`chown -R ${user}:${user} ${this.work_dir.merged}/home/${user}`, echo)
    shx.mkdir(`-p`, `${this.work_dir.merged}/home/${user}/Desktop`)

    // Copiare i link sul desktop per user live
    shx.cp('/usr/share/applications/penguins-eggs.desktop', `${this.work_dir.merged}/home/${user}/Desktop`)
    shx.cp('/usr/share/applications/dwagent-sh.desktop', `${this.work_dir.merged}/home/${user}/Desktop`)
    if (Utils.packageIsInstalled('calamares')) {
      shx.cp('/usr/share/applications/install-debian.desktop', `${this.work_dir.merged}/home/${user}/Desktop`)
      await exec(`chown ${user}:${user} ${this.work_dir.merged}/home/${user}/Desktop/install-debian.desktop`, echo)
      await exec(`chmod +x ${this.work_dir.merged}/home/${user}/Desktop/install-debian.desktop`, echo)
    }
  }

  /**
   * Add or remove exclusion
   * @param add {boolean} true = add, false remove
   * @param exclusion {atring} path to add/remove
   */
  addRemoveExclusion(add: boolean, exclusion: string): void {
    if (exclusion.startsWith('/')) {
      exclusion = exclusion.substring(1) // remove / initial Non compatible with
    }

    if (add) {
      if (this.session_excludes === '') {
        this.session_excludes += `-e '${exclusion}' `
      } else {
        this.session_excludes += ` '${exclusion}' `
      }
    } else {
      this.session_excludes.replace(` '${exclusion}'`, '')
      if (this.session_excludes === '-e') {
        this.session_excludes = ''
      }
    }
  }

  /**
   * makeEfi
   * Create /boot and /efi for UEFI
   */
  async makeEfi(verbose = false) {
    let echo = Utils.setEcho(verbose)
    if (verbose) {
      console.log('ovary: makeEfi')
    }

    /**
     * Carica il primo grub.cfg dal memdisk, quindi in sequenza
     * grub.cfg1 -> memdisk
     * grub.cfg2 -> /boot/grub/x86_64-efi
     * grub.cfg3 -> /boot/grub
     */


    const tempDir = shx.exec('mktemp -d /tmp/work_temp.XXXX', { silent: true }).stdout.trim()
    // shx.rm('tempDir')
    // shx.ln('-s', tempDir, 'tempDir')

    // for initial grub.cfg
    shx.mkdir('-p', `${tempDir}/boot/grub`)
    const grubCfg = `${tempDir}/boot/grub/grub.cfg`
    shx.touch(grubCfg)
    let text = ''
    text += 'search --file --set=root /isolinux/isolinux.cfg\n'
    text += 'set prefix=(\$root)/boot/grub\n'
    text += 'source \$prefix/x86_64-efi/grub.cfg\n'
    Utils.write(grubCfg, text)

    // #################################

    /**
    * Andiamo a costruire efi_work
     */

    if (!fs.existsSync(this.efi_work)) {
      shx.mkdir(`-p`, this.efi_work)
    }

    // pushd efi_work
    const currentDir = process.cwd()

    /**
     * efi_work
     */
    process.chdir(this.efi_work)

    /**
     * start with empty directories Clear dir boot and efi
     */
    const files = fs.readdirSync('.');
    for (var i in files) {
      if (files[i] === 'boot') {
        await exec(`rm ./boot -rf`, echo)
      }
      if (files[i] === 'efi') {
        await exec(`rm ./efi -rf`, echo)
      }
    }
    shx.mkdir(`-p`, `./boot/grub/x86_64-efi`)
    shx.mkdir(`-p`, `./efi/boot`)

    // copy splash
    shx.cp(path.resolve(__dirname, '../../assets/penguins-eggs-splash.png'), `${this.efi_work}/boot/grub/spash.png`)

    // second grub.cfg file
    let cmd = `for i in $(ls /usr/lib/grub/x86_64-efi|grep part_|grep \.mod|sed 's/.mod//'); do echo "insmod $i" >> boot/grub/x86_64-efi/grub.cfg; done`
    await exec(cmd, echo)
    // Additional modules so we don't boot in blind mode. I don't know which ones are really needed.
    cmd = `for i in efi_gop efi_uga ieee1275_fb vbe vga video_bochs video_cirrus jpeg png gfxterm ; do echo "insmod $i" >> boot/grub/x86_64-efi/grub.cfg ; done`
    await exec(cmd, echo)

    await exec(`echo source /boot/grub/grub.cfg >> boot/grub/x86_64-efi/grub.cfg`, echo)
    /**
     * fine lavoro in efi_work
     */
    
    // pushd tempDir
    process.chdir(tempDir)

    // make a tarred "memdisk" to embed in the grub image
    await exec(`tar -cvf memdisk boot`, echo)

    // make the grub image
    await exec(`grub-mkimage -O x86_64-efi -m memdisk -o bootx64.efi -p '(memdisk)/boot/grub' search iso9660 configfile normal memdisk tar cat part_msdos part_gpt fat ext2 ntfs ntfscomp hfsplus chain boot linux`, echo)

    // pdpd (torna a efi_work)
    process.chdir(this.efi_work)

    // copy the grub image to efi/boot (to go later in the device's root)
    shx.cp(`${tempDir}/bootx64.efi`, `./efi/boot`)

    // Do the boot image "boot/grub/efiboot.img"
    await exec(`dd if=/dev/zero of=boot/grub/efiboot.img bs=1K count=1440`, echo)
    await exec(`/sbin/mkdosfs -F 12 boot/grub/efiboot.img`, echo)
    shx.mkdir(`-p`, `img-mnt`)
    await exec(`mount -o loop boot/grub/efiboot.img img-mnt`, echo)
    shx.mkdir('-p', `img-mnt/efi/boot`)
    shx.cp(`-r`, `${tempDir}/bootx64.efi`, `img-mnt/efi/boot/`)

    // ###############################

    // copy modules and font
    shx.cp(`-r`, `/usr/lib/grub/x86_64-efi/*`, `boot/grub/x86_64-efi/`)

    // if this doesn't work try another font from the same place (grub's default, unicode.pf2, is much larger)
    // Either of these will work, and they look the same to me. Unicode seems to work with qemu. -fsr
    fs.copyFileSync(`/usr/share/grub/unicode.pf2`, `boot/grub/font.pf2`)

    // doesn't need to be root-owned ${pwd} = current Directory
    const user = Utils.getPrimaryUser()
    // await exec(`chown -R ${user}:${user} $(pwd) 2>/dev/null`, echo)
    // console.log(`pwd: ${pwd}`)
    // await exec(`chown -R ${user}:${user} $(pwd)`, echo)

    // Cleanup efi temps
    await exec(`umount img-mnt`, echo)
    await exec(`rmdir img-mnt`, echo)

    // popD Torna alla directory corrente
    process.chdir(currentDir)

    // Copy efi files to iso
    await exec(`rsync -avx ${this.efi_work}/boot ${this.work_dir.pathIso}/`, echo)
    await exec(`rsync -avx ${this.efi_work}/efi  ${this.work_dir.pathIso}/`, echo)

    // Do the main grub.cfg (which gets loaded last):
    fs.copyFileSync(path.resolve(__dirname, '../../conf/grub.cfg.template'), `${this.work_dir.pathIso}/boot/grub/grub.cfg`)
    shx.cp(path.resolve(__dirname, '../../conf/loopback.cfg'), `${this.work_dir.pathIso}/boot/grub/`)
  }

  /**
   * editEfi
   */
  async editEfi(verbose = false) {
    if (verbose) {
      console.log('editing grub.cfg')
    }
    // editEfi()
    const gpath = `${this.work_dir.pathIso}/boot/grub/grub.cfg`
    shx.sed('-i', '%custom-name%', this.distro.name, gpath)
    shx.sed('-i', '%kernel%', Utils.kernerlVersion(), gpath)
    shx.sed('-i', '%vmlinuz%', `/live${this.kernel_image}`, gpath)
    shx.sed('-i', '%initrd-img%', `/live${this.initrd_image}`, gpath)
    shx.sed('-i', '%username-opt%', this.username_opt, gpath)
    shx.sed('-i', '%netconfig-opt%', this.netconfig_opt, gpath)
    shx.sed('-i', '%timezone-opt%', this.timezone_opt, gpath)
  }

  /**
   * makeIsoImage
   */
  async makeIsoImage(verbose = false) {
    let echo = { echo: false, ignore: false }
    if (verbose) {
      echo = { echo: true, ignore: false }
    }

    const volid = this.getFilename(this.iso.distroName)
    const isoName = `${this.snapshot_dir}${volid}`
    if (verbose) {
      console.log(`ovary: makeIsoImage ${isoName}`)
    }
    
    const uefi_opt = '-eltorito-alt-boot -e boot/grub/efiboot.img -isohybrid-gpt-basdat -no-emul-boot'

    let isoHybridOption = `-isohybrid-mbr ${this.iso.isolinuxPath}isohdpfx.bin `

    if (this.make_isohybrid) {
      if (fs.existsSync('/usr/lib/syslinux/mbr/isohdpfx.bin')) {
        isoHybridOption = '-isohybrid-mbr /usr/lib/syslinux/mbr/isohdpfx.bin'
      } else if (fs.existsSync('/usr/lib/syslinux/isohdpfx.bin')) {
        isoHybridOption = `-isohybrid-mbr /usr/lib/syslinux/isohdpfx.bin`
      } else if (fs.existsSync('/usr/lib/ISOLINUX/isohdpfx.bin')) {
        isoHybridOption = `-isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin`
      } else {
        console.log(`Can't create isohybrid.  File: isohdpfx.bin not found. The resulting image will be a standard iso file`)
      }
      this.eggName = this.getFilename(this.iso.distroName)
      const isoName = `${this.snapshot_dir}${this.eggName}`

      let cmd = `xorriso -as mkisofs -r -J -joliet-long -l -iso-level 3 -cache-inodes ${isoHybridOption} -partition_offset 16 -volid ${this.eggName} -b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table ${uefi_opt} -o ${isoName} ${this.work_dir.pathIso}`
      await exec(cmd, echo)
    }
  }

  /**
   * funzioni private
   * Vengono utilizzate solo da Ovary
   */

  /**
   * addDebianRepo
   */
  async addDebianRepo(verbose = false) {
    if (verbose) {
      console.log(`ovary: addDebianRepo`)
    }
    shx.cp('-r', '/home/live/debian-live/*', this.work_dir.pathIso)
  }

  /**
   * only show the result
   */
  finished() {
    console.log('eggs is finished!\nYou can find the file iso: ' + chalk.cyanBright (this.eggName) + '\nin the nest: ' + chalk.cyanBright(this.snapshot_dir) + '.')
  }
}

/**
 * Crea il path se non esiste
 * @param path 
 */
async function makeIfNotExist(path: string, verbose = false) {
  let echo = Utils.setEcho(verbose)

  if (!(fs.existsSync(path))) {
    const cmd = `mkdir ${path} -p`
    await exec(cmd, echo)
  }
}

