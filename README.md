penguins-eggs
=============

### Penguin&#39;s eggs are generated and new birds are ready to fly...
[![sources](https://img.shields.io/badge/github-sources-blue)](https://github.com/pieroproietti/penguins-eggs)
[![blog](https://img.shields.io/badge/blog-penguin's%20eggs-blue)](https://penguins-eggs.net)
[![sources-documentation](https://img.shields.io/badge/sources-documentation-blue)](https://penguins-eggs.sourceforge.io/)
[![guide](https://img.shields.io/badge/guide-penguin's%20eggs-blue)](https://penguins-eggs.net/book/)
[![npm version](https://img.shields.io/npm/v/penguins-eggs.svg)](https://npmjs.org/package/penguins-eggs)
[![deb](https://img.shields.io/badge/deb-packages-orange)](https://sourceforge.net/projects/penguins-eggs/files/packages-deb)
[![iso](https://img.shields.io/badge/iso-images-orange)](https://sourceforge.net/projects/penguins-eggs/files/iso)


# Index
<!-- toc -->
* [Index](#index)
* [Presentation](#presentation)
* [Addons](#addons)
* [Yolk](#yolk)
* [What distributions can I use?](#what-distributions-can-i-use)
* [Install penguins-eggs](#install-penguins-eggs)
* [Usage](#usage)
* [Commands](#commands)
* [That's all Folks!](#thats-all-folks)
<!-- tocstop -->

# Presentation
penguins-eggs is a console utility, in active development, who let you to remaster your system and redistribuite it as iso images or from the lan via PXE remote boot.

The scope of this project is to implement the process of remastering your version of Linux, generate it as ISO image to burn on a CD/DVD or copy to a usb key to boot your system. You can also boot your egg - via remote boot - on your LAN. You can easily install your live system with gui calamares installer or eggs cli installer.

All it is written in pure typescript, so ideally can be used with differents Linux distros. Yes, there are big differences about package manager used, but not so much in the way to work of bash and various programs used to build the iso.

penguins-eggs, at the moment 2020 november 2 is a mature tool and is extremely usefull, You can easily create your organization/school version of Linux and deploy it on your LAN, give it to your friends as usb key or publish yours eggs in the internet!

Try penguins-eggs yes, it is a console utility - no GUI - but don't be scared, penguins-eggs is a console command - really very simple - if you are able to open a terminal, you can use it and yours final users will enjoy of full gui and pratical installer to install your livecd.

# Addons
Starting with version 7.6.x, an addons architecture has been added  to eggs, that allows third parties to develop extensions. Note that we currently have an extension for the theme that includes both calamares branding and installer link and icon. In addition, also as addon has been developed others addons, to chosen hoosing between GUI or CLI installation, adapd video resolution, etc.

# Yolk 
yolk so called - staying on the subject of eggs - is a local repository included in the livecd that contains a minimum of indispensable packages during installation. Thanks to yolk, you can safely install your system without the need for an internet connection.

# What distributions can I use?
Eggs is born on Debian strecth/buster, full support Debian bullseys, Devuan beowulf, Ubuntu focal, bionic and derivatives. I usually try it against Debian buster, Devuan beowulf, Linux Mint 19.3 tricia (bionic derivated) and Linux Mint 20 ulyana (focal derivated) before releases. I tried it successfully in LMDE 4 debbie, and deepin. Eggs, generally must work with all the derivates from that distros.

Some iso images remastered with eggs are in the [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/files/iso/). 

## Note about deb packages

You can use the same package for all distributions using deb, naturally choosing the appropriate architecture (i386/amd64).

# Install penguins-eggs

## Debian package
Actually eggs is released both in deb package for i386 as amd64 architectures.

This simplest way to installe eggs is to download the [package eggs](https://sourceforge.net/projects/penguins-eggs/files/packages-deb/) from [sourceforge page of the project](https://sourceforge.net/projects/penguins-eggs/) and install it

```
sudo dpkg -i eggs_7.6.65-1_amd64.deb
```

or, on a i386 system:
```
sudo dpkg -i eggs_7.6.65-1_i386.deb
```

_Note about deb packages_ You can use the same package for all distributions using deb, naturally choosing the appropriate architecture (i386/amd64).

_Notes on nodejs versions and i386 architecture_ . You can read more about at [i386-nodejs](https://github.com/pieroproietti/penguins-eggs/blob/master/documents/i386-nodejs.md).

## NPM package (require nodejs)

If you have already nodejs installed, you can install penguins-eggs with the utility npm (node package manager).

Simply copy and past the following lines:

```sudo npm config set unsafe-perm true```

```sudo npm i penguins-eggs -g```

# Usage
<!-- usage -->
```sh-session
$ npm install -g penguins-eggs
$ eggs COMMAND
running command...
$ eggs (-v|--version|version)
penguins-eggs/7.6.66 linux-x64 node-v14.15.0
$ eggs --help [COMMAND]
USAGE
  $ eggs COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`eggs adapt`](#eggs-adapt)
* [`eggs calamares`](#eggs-calamares)
* [`eggs export:deb`](#eggs-exportdeb)
* [`eggs export:docs`](#eggs-exportdocs)
* [`eggs export:iso [FILE]`](#eggs-exportiso-file)
* [`eggs help [COMMAND]`](#eggs-help-command)
* [`eggs info`](#eggs-info)
* [`eggs install`](#eggs-install)
* [`eggs kill`](#eggs-kill)
* [`eggs sterilize`](#eggs-sterilize)
* [`eggs tools:clean`](#eggs-toolsclean)
* [`eggs tools:initrd`](#eggs-toolsinitrd)
* [`eggs tools:locales`](#eggs-toolslocales)
* [`eggs tools:sanitize`](#eggs-toolssanitize)
* [`eggs tools:skel`](#eggs-toolsskel)
* [`eggs tools:yolk`](#eggs-toolsyolk)
* [`eggs update`](#eggs-update)

## `eggs adapt`

adapt monitor resolution for VM only

```
USAGE
  $ eggs adapt

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ eggs adjust
```

_See code: [src/commands/adapt.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/adapt.ts)_

## `eggs calamares`

calamares or install or configure it

```
USAGE
  $ eggs calamares

OPTIONS
  -h, --help     show CLI help
  -i, --install  install calamares and it's dependencies
  -v, --verbose
  --final        final: remove eggs prerequisites, calamares and all it's dependencies
  --theme=theme  theme/branding for eggs and calamares

EXAMPLES
  ~$ sudo eggs calamares 
  create/renew calamares configuration's files

  ~$ sudo eggs calamares -i 
  install calamares and create it's configuration's files
```

_See code: [src/commands/calamares.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/calamares.ts)_

## `eggs export:deb`

export package eggs-v7-6-x-1.deb in the destination host

```
USAGE
  $ eggs export:deb

OPTIONS
  -c, --clean  remove old .deb before to copy
  -h, --help   show CLI help
```

_See code: [src/commands/export/deb.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/export/deb.ts)_

## `eggs export:docs`

remove and export docType documentation of the sources in the destination host

```
USAGE
  $ eggs export:docs

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/export/docs.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/export/docs.ts)_

## `eggs export:iso [FILE]`

export iso in the destination host

```
USAGE
  $ eggs export:iso [FILE]

OPTIONS
  -c, --clean  delete old ISOs before to copy
  -h, --help   show CLI help
```

_See code: [src/commands/export/iso.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/export/iso.ts)_

## `eggs help [COMMAND]`

display help for eggs

```
USAGE
  $ eggs help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `eggs info`

informations about system and eggs

```
USAGE
  $ eggs info

EXAMPLE
  $ eggs info
  You will find here informations about penguin's eggs!
```

_See code: [src/commands/info.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/info.ts)_

## `eggs install`

system installater cli (the eggs became penguin)

```
USAGE
  $ eggs install

OPTIONS
  -g, --gui        use gui installer
  -h, --info       show CLI help
  -l, --lvmremove  remove lvm /dev/pve
  -u, --umount     umount devices
  -v, --verbose    verbose

ALIASES
  $ eggs hatch

EXAMPLE
  $ eggs install
  penguin's eggs installation
```

_See code: [src/commands/install.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/install.ts)_

## `eggs kill`

kill the eggs/free the nest

```
USAGE
  $ eggs kill

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose

EXAMPLE
  $ eggs kill
  kill the eggs/free the nest
```

_See code: [src/commands/kill.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/kill.ts)_

## `eggs sterilize`

remove all packages installed as prerequisites, calamares and configurations

```
USAGE
  $ eggs sterilize

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose
```

_See code: [src/commands/sterilize.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/sterilize.ts)_

## `eggs tools:clean`

clean system log, apt, etc

```
USAGE
  $ eggs tools:clean

OPTIONS
  -h, --help     show CLI help
  -v, --verbose  verbose
```

_See code: [src/commands/tools/clean.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/tools/clean.ts)_

## `eggs tools:initrd`

Test initrd

```
USAGE
  $ eggs tools:initrd

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
  --check=check  check if necessary to clean initrd.img
  --clean=clean  clean the initrd.img
```

_See code: [src/commands/tools/initrd.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/tools/initrd.ts)_

## `eggs tools:locales`

install/clean locales

```
USAGE
  $ eggs tools:locales

OPTIONS
  -h, --help       show CLI help
  -r, --reinstall  reinstall locales
  -v, --verbose    verbose
```

_See code: [src/commands/tools/locales.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/tools/locales.ts)_

## `eggs tools:sanitize`

sanitize

```
USAGE
  $ eggs tools:sanitize

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/tools/sanitize.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/tools/sanitize.ts)_

## `eggs tools:skel`

update skel from home configuration

```
USAGE
  $ eggs tools:skel

OPTIONS
  -h, --help       show CLI help
  -u, --user=user  user to be used
  -v, --verbose

EXAMPLE
  $ eggs skel --user mauro
  desktop configuration of user mauro will get used as default
```

_See code: [src/commands/tools/skel.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/tools/skel.ts)_

## `eggs tools:yolk`

configure eggs to install without internet

```
USAGE
  $ eggs tools:yolk

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

EXAMPLE
  $ eggs yolk -v
```

_See code: [src/commands/tools/yolk.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/tools/yolk.ts)_

## `eggs update`

update/upgrade the penguin's eggs tool.

```
USAGE
  $ eggs update

OPTIONS
  -h, --help      show CLI help
  -i, --internet  import deb package from internet
  -l, --lan       import deb package from LAN
  -v, --verbose   verbose

DESCRIPTION
  This way of update work only with npm installation, if you used the debian package version, please download the new 
  one and install it.

EXAMPLE
  $ eggs update
  update/upgrade the penguin's eggs tool
```

_See code: [src/commands/update.ts](https://github.com/pieroproietti/penguins-eggs/blob/v7.6.66/src/commands/update.ts)_
<!-- commandsstop -->

# That's all Folks!
No need other configurations, penguins-eggs are battery included or better, as in the real, live is inside! :-D

## More informations

You can find more informations at [Penguin's eggs blog](https://penguins-eggs.net).

## Contacts
Feel free to contact [me](https://gitter.im/penguins-eggs-1/community?source=orgpage) or open an issue on [github](https://github.com/pieroproietti/penguins-eggs/issues).

* mail: piero.proietti@gmail.com

## Copyright and licenses
Copyright (c) 2017, 2020 [Piero Proietti](https://penguins-eggs.net/about-me.html), dual licensed under the MIT or GPL Version 2 licenses.
