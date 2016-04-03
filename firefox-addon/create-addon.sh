cd edictor-winter
ln -s ../../../edictor
zip -r ../edictor-winter.xpi edictor/css/*
zip -r ../edictor-winter.xpi edictor/digling/*
zip -r ../edictor-winter.xpi edictor/img/*
zip -r ../edictor-winter.xpi edictor/data/*
zip -r ../edictor-winter.xpi edictor/js/*
zip -r ../edictor-winter.xpi edictor/plugouts/*
zip -r ../edictor-winter.xpi edictor/help/*
zip -r ../edictor-winter.xpi edictor/fonts/*
zip -r ../edictor-winter.xpi edictor/*.html
zip -r ../edictor-winter.xpi edictor/LICENSE.md
zip -r ../edictor-winter.xpi edictor/README.md
rm edictor
zip -r ../edictor-winter.xpi *
