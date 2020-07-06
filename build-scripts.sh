#!/bin/bash
# vi: set sw=4 ts=4:

BE='./build-ext.sh'
if [ -e build-ext.sh ]; then
    cp build-ext.sh build-ext.dist.sh
    chmod 755 build-ext.dist.sh
else
    BE='./build-ext-dist.sh'
fi

CMD="$1"
VERSION=`cat VERSION`
EXT="scripts-extension"
NAME="Scripts"
DESCRIPTION="Implements scripting using the formula language. Can be used e.g. to generate reports"
MODULE=Scripts

echo "Check if DataTables needs to be upgraded at https://datatables.net/download/index"
echo "Installed modules: "
echo " - Data Tables"
echo ""
echo "Extensions:"
echo " - Buttons"
echo "   - Column visibility"
echo "   - HTML5 export"
echo "     - JSZip"
echo "     - pdfmake"
echo "   - Print view"
echo " - FixedHeader"  
echo " - SearchPanes"  
echo ""
unzip DataTables.zip datatables.min.css datatables.min.js
cp datatables.min.css client/modules/scripts/css/
cp datatables.min.js client/modules/scripts/lib

$BE "$CMD" "$VERSION" "$EXT" "$NAME" "$DESCRIPTION" "$MODULE"

rm -f client/modules/scripts/css/datatables.min.css 
rm -f client/modules/scripts/lib/datatables.min.js
rm -f datatables.min.js datatables.min.css
