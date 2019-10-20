/**
 * penguins-eggs: Prerequisites.ts
 * 
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

"use strict";

import shell from "shelljs";
import { IOses } from "../interfaces";

class Prerequisites {

    public async cli(): Promise<void> {
        console.log(
            ">>> eggs: Installing the prerequisites packages..."
        );
        let cmd=`apt-get update`;
        console.log(cmd);
        shell.exec(cmd, {async: true});


        cmd = `apt-get --yes install \
        lvm2 \
        parted \
        squashfs-tools \
        xorriso \
        syslinux \
        isolinux \
        live-boot \
        xterm \
        zenity \
        open-infrastructure-system-config`;


        cmd = `apt-get clean`;
        console.log(cmd);
        shell.exec(cmd, {async: true});

        cmd = `apt-get autoclean`;
        console.log(cmd);
        shell.exec(cmd, {async: true});
    }

    public async calamares() {
        console.log(
            ">>> eggs: Installing the prerequisites calamares..."
        );
        let cmd = `apt-get update`;
        console.log(cmd);
        shell.exec(cmd, {async: true});


        cmd = `apt-get --yes install \
        calamares \
        calamares-settings-debian \
        qml-module-qtquick2 \
        qml-module-qtquick-controls`;
        console.log(cmd);
        shell.exec(cmd, {async: true});

        cmd = `apt-get clean`;
        console.log(cmd);
        shell.exec(cmd, {async: true});

        cmd = `apt-get autoclean`;
        console.log(cmd);
        shell.exec(cmd, {async: true});
    }

    public async sterilize() {
        console.log(`>>> eggs: removing eggs prerequisites...`);
        let cmd = `apt-get --yes remove --purge \
        calamares \
        calamares-settings-debian \
        qml-module-qtquick2 \
        qml-module-qtquick-controls`;
        console.log(cmd);
        shell.exec(cmd, {async: true});

        cmd = `apt-get --yes --purge remove  \
        squashfs-tools \
        xorriso \
        syslinux \
        isolinux \
        live-boot \
        open-infrastructure-system-config`;
        console.log(cmd);
        shell.exec(cmd, {async: true});


        cmd = `apt-get --yes autoremove`;
        console.log(cmd);
        shell.exec(cmd, {async: true});

        cmd = `apt-get clean`;
        console.log(cmd);
        shell.exec(cmd, {async: true});

        cmd = `apt-get autoclean`;
        console.log(cmd);
        shell.exec(cmd, {async: true});
    }

}
export default Prerequisites;