install:
	git clone https://github.com/intercontinental-dictionary-series/keypano.git
	pip install git+https://github.com/digling/edictor.git#egg=edictor[all]
	edictor wordlist --dataset=keypano/cldf/cldf-metadata.json --name=keypano
	edictor server
