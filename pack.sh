ROOT=$PWD
cd $ROOT/build
zip -q -r pointread.zip * -x "*.zip"
mv *.zip ../
