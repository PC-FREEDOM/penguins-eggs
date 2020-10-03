/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Tools from '../classes/tools'

/**
 * 
 */
export default class Update extends Command {
   static description = "update/upgrade the penguin's eggs tool.\nThis way of update work only with npm installation, if you used the debian package version, please download the new one and install it."

   static examples = [`$ eggs update\nupdate/upgrade the penguin's eggs tool`]

   static flags = {
      help: flags.help({ char: 'h' }),
      import: flags.boolean({ char: 'i', description: 'import deb package' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }

   async run() {
      Utils.titles('update')

      const { flags } = this.parse(Update)

      if (Utils.isRoot()) {
         if (await Utils.customConfirm(`Select yes to continue...`)) {
            Utils.warning('Updating eggs...')
            if (Utils.isSources()) {
               Utils.warning('You are using eggs from sources')
               console.log('You can upgrade getting a new version from git:')
               console.log('cd ~/penguins-eggs')
               console.log('git pull')
               console.log('')
               console.log('You can also create a fresh installation on your hone:')
               console.log('cd ~')
               console.log('git clone https://github.com/pieroproietti/penguins-eggs')
               console.log('')
               console.log('Before to use eggs, remember to install npm packages:')
               console.log('cd ~/penguins-eggs')
               console.log('npm install')
            } else if (Utils.isDebPackage()) {
               Utils.warning('You have eggs installed a package .deb')
               console.log('If you have eggs in yours repositories apt:')
               console.log('sudo apt update')
               console.log('sudo apt upgrade eggs')
               console.log('')
               console.log('Else, download package from https://sourceforge.net/projects/penguins-eggs/files/packages-deb/')
               console.log('and install it with:')
               console.log('sudo dpkg -i eggs_7.6.x-x_xxxxx.deb')
               if (flags.import) {
                  importDeb()
               }
            } else {
               console.log(`updating ${Utils.getPackageName()} version ${Utils.getPackageVersion()}`)
               shx.exec(`npm update ${Utils.getPackageName()} -g`)

            }
         }
      }
   }
}



/**
 * importazione di eggs .deb
 */
async function importDeb() {

   const Tu = new Tools
   Utils.titles()
   const exec = require('../lib/utils').exec

   await exec(`scp ${Tu.export_user_deb}@${Tu.export_host}:${Tu.export_path_deb}${Tu.file_name_deb} .`)
   if (Utils.isRoot()) {
      console.log('remove and purge eggs')
      await exec('apt-get -y purge eggs ')
      await exec('rm /usr/lib/penguins-eggs -rf')
   }
   Utils.warning(`eggs was removed completely.`)
   Utils.warning(`Don't forget to run sudo pt sanitize to clean all the remains of the previus eggs production!`)
   console.log('sudo dpkg -i eggs... to install')
}