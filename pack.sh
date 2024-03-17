ROOT=$PWD
cd $ROOT/build
zip -q -r mindecho.zip * -x "*.zip"
mv *.zip ../
