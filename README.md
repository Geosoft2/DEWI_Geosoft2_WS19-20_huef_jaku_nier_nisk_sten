<img src="https://tnier01.github.io/DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten/DEWI_Logo.jpg" alt="DEWI direct extrem weather information" width="350"/>

#### A project as part of the class "Geosoftware II" in the winter term 2019/ 2020 at the [Institute for Geoinformatics](https://www.ifgi.de) at the university of Muenster.


## GitHub Repository
[DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten](https://github.com/tnier01/DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten)


## Getting Started

1. [Download](https://github.com/tnier01/DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten/archive/master.zip) or clone the GitHub Repository
``git clone https://github.com/tnier01/DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten``


## Starting with Docker:

1. install Docker on your local machine
2. open shell and navigate to folder ``DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten``
3. ensure that the settings in docker-compose.yml match the settings in config.yml
```
DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten
 └── api
  |   └── config.yml
 └── docker-compose.yml  
```
4. run ``docker-compose up``
5. open  [localhost:3000](http://localhost:3000/)


## Starting without Docker:
1. install [Node.js v10.xx](https://nodejs.org/en/) and [MongoDB v4.xx](https://www.mongodb.com/download-center/community?) on your local machine
2. open shell and create MongoDB
   * on Windows: ``"C:\Program Files\MongoDB\Server\4.2\bin\mongod.exe" --dbpath="C:\path_to_DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten\api\data"`` (ensure that the folder ``data`` exists)
3. open another shell and navigate to folder ``api``
```
DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten
 └── api
```

 * run ``npm install``
 * run ``npm start``
4. wait until API is started successfully
5. open another shell and navigate to folder ``app``
```
DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten
└── app
```

 * run ``npm install``
 * run ``npm start``
5. open  [localhost:3000](http://localhost:3000)

## Test

A Postman test script is provided as
``DEWITest.json``.
```
DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten
└── api
    └── test
        └── DEWITest.json
```
It can either be uploaded to [postman](https://www.getpostman.com/) or executed via [newman](https://www.npmjs.com/package/newman).

If newman is already installed you just can use ```npm test```:
1. start the Application wit npm or docker like explained above
2. open another shell and navigate to folder ``api``
3. run ``npm test`` and inspect result

With newman it is also possible to inspect performance.
Eaxample Test Run with 100 iterations and an json response object.
```
newman run <Folder> -n 100 -r json,cli --reporter-json-export <path>
```
A result of this performance test, conducted by ourselves, can be downloaded [here](https://uni-muenster.sciebo.de/s/2Y1jwnNJUjU7vzg/download).


Further information about [newman](https://www.npmjs.com/package/newman).

## API
Further information about the API is available in the [wiki](https://github.com/tnier01/DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten/wiki).
The provided ``config.yml`` template offers various possibilities to configure the API.
```
DEWI_Geosoft2_WS19-20_huef_jaku_nier_nisk_sten
 └── api
     └── config.yml
```

## Demo
A demo with test data supplied can be accessed via [localhost:3000/demo](http://localhost:3000/demo).

## Authors
* Phil Hüffer
* Nick Jakuschona
* Tom Niers
* Luc Niski
* Jan Sgenkamp
