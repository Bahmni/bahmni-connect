#!/bin/sh -x -e

PATH_OF_CURRENT_SCRIPT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source ${PATH_OF_CURRENT_SCRIPT}/vagrant_functions.sh
#USER=jss
USER=bahmni

if [ "$#" == "0" ]; then
	FOLDER="dist"
else
	FOLDER="$1"
fi

run_in_vagrant -c "sudo rm -rf /var/www/bahmni-connect-apps"
run_in_vagrant -c "sudo ln -s /bahmni/bahmni-connect/ui/$FOLDER/ /var/www/bahmni-connect-apps"
run_in_vagrant -c "sudo chown -h ${USER}:${USER} /var/www/bahmni-connect-apps"

run_in_vagrant -c "sudo rm -rf /var/www/style-guide"
run_in_vagrant -c "sudo ln -s /bahmni/openmrs-module-bahmniapps/ui/style-guide/ /var/www/style-guide"
run_in_vagrant -c "sudo chown -h ${USER}:${USER} /var/www/style-guide"