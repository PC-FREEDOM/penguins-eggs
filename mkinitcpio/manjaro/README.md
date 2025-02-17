# penguins-eggs manjaro

To not depend from manjaro-tools-iso - who bring a lot of stuffs not necessary for eggs - we need:

* copy [initcpio stuffs](https://gitlab.manjaro.org/tools/development-tools/manjaro-tools/-/tree/master/initcpio) from [manjaro-tools](https://gitlab.manjaro.org/tools/development-tools/manjaro-tools) to /usr/lib/initcpio
* copy manjaro-tools/initcpio/script/miso_shutdown in /etc/initcpio/ 

## Install manjaro-tools

Copy and paste follow instructions

```
git clone https://gitlab.manjaro.org/tools/development-tools/manjaro-tools
sudo cp manjaro-tools/initcpio/hooks/ /usr/lib/initcpio/ -R
sudo cp manjaro-tools/initcpio/install/ /usr/lib/initcpio/ -R
sudo cp manjaro-tools/initcpio/script/miso_shutdown /etc/initcpio/
```

## Build and install penguins-eggs

Copy and paste follow instructions
```
mkdir try-penguins-eggs
cd try-penguins-eggs
wget https://raw.githubusercontent.com/pieroproietti/penguins-eggs-manjaro/main/PKGBUILD
wget https://raw.githubusercontent.com/pieroproietti/penguins-eggs-manjaro/main/penguins-eggs.install
makepkg -srcCi
```

# Develop and collaborations link
* penguins-eggs discussion on [manjaro-forum](https://forum.manjaro.org/t/penguins-eggs-help-needed-for-manjaro-compatibility/96799)
* penguins-eggs PKGBUILD on [community](https://gitlab.manjaro.org/packages/community/penguins-eggs)
* penguins-eggs PKGBUILD [my proposal](https://github.com/pieroproietti/penguins-eggs-manjaro) (*)
* penguins-eggs [sources](https://github.com/pieroproietti/penguins-eggs)
* penguins-eggs [book](https://penguins-eggs.net/book/)
* penguins-eggs [blog](https://penguins-eggs.net)

(*) Here we refere always to that

