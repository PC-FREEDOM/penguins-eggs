/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'

/**
 * 
 */
export default class Sterilize extends Command {
   static description = 'remove all packages installed as prerequisites'

   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }

   async run() {
      Utils.titles('sterilize')

      const { flags } = this.parse(Sterilize)
      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot() && Pacman.prerequisitesEggsCheck()) {
         if (await await Utils.customConfirm(`Select yes to continue...`)) {
            Utils.warning('Removing eggs prerequisites...')
            await Pacman.prerequisitesEggsRemove(verbose)
            if (Pacman.prerequisitesCalamaresCheck()) {
               Utils.warning('Removing calamares prerequisites...')
               await Pacman.prerequisitesCalamaresRemove(verbose)
               Utils.warning('Removing files configuration...')
               await Pacman.configurationRemove(verbose)
               await Pacman.clean(verbose)
            }
         }
      } else {
         console.log('eggs prerequisites not installed!')
      }
   }
}
