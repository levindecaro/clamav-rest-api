#### Overview

This is a simple implementation of REST API for ClamAV virus scanner. You can use it to scan files uploaded by users, before they are saved or put into final destination, or to scan files on demand. 

This product is a modification for a specific use case which deviate from the original author benzino77 implementation.
https://github.com/benzino77/clamav-rest-api


![Animation](./docs/images/animation.gif)

####  Deployment

First of all you have to have running ClamAV instance configured to accept TCP connections from `clamav-rest-api` instances. For more details I will guide you to CalmAV documentation ([here](https://blog.clamav.net/2016/06/regarding-use-of-clamav-daemons-tcp.html) and [here](https://www.clamav.net/documents/configuration#clamdconf)) but it's enough to say that you need `TCPSocket 3310` and eventually `TCPAddr` in your `clamd.conf` file. The easiest way is to use sidecar image with ClamAV already configured from here https://github.com/levindecaro/clamav-docker or docker.io/levindecaro/clamav:v0.7

**_Note_:**
You have to give couple of minutes to start/crashloopback because it needs to download new signatures from ClamAV servers (update its viruses database).

**_Recommended_** way of using `clamav-rest-api` is to start it as docker container or on k8s cluster (see [Configuration](#Configuration) below):

In [examples](./examples/k8s) directory there are kubernetes YAML files to create `configMap`, `deployments` and `services`. Just run `kubectl` command to create them in proper order:

Before the deployment, you need prepare the certificates for TLS and the password authentication

SSL Certificate
```
kind: Secret
apiVersion: v1
metadata:
  name: cra-cert
  namespace: cra
data:
  cert.pem: ### base64encoded certificate ###
  key.pem: ### base64encoded private key ###
type: Opaque
```

Credential
```
kind: Secret
apiVersion: v1
metadata:
  name: cra-secret
  namespace: cra
data:
  APP_USER: ### base64encoded-usernme ###
  APP_USER_PASSWORD: ### base64encoded-password ###
type: Opaque
```

Deployment
```bash
kubectl apply -f cra-cert.yaml
kubectl apply -f cra-secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

`clamav-rest-api` service is published on cluster network  port 19443.

You can also start `clamav-rest-api` by cloning the repo and run commands listed below:

```
npm install
npm install -D # if you want to run tests or examples
# Configuration described below - needed before start app
npm start
```


##### Configuration

`clamav-rest-api` needs some information to run properly. For example it needs to know where to find ClamAV. This kind of information can be provided by `.env` file or by setting environemnt variables. Example `.env` file can be find [here](./.env.example). What you need to do is to copy `.env.example` file to `.env` and edit it to provide configuration parameters which meet your needs.
Here is a short description of those parameters:

- `APP_USER` - username who used to authenticate to `clamav-rest-api`
- `APP_USER_PASSWORD` - password for `APP_USER`
- `APP_PORT` - port number on which `clamav-rest-api` will listen to requests
- `APP_FORM_KEY` - form key (element name) used when uploading files to scan (see [examples directory](examples/)). `clamav-rest-api` will only accept files uploaded with this form key.
- `APP_MORGAN_LOG_FORMAT` - log format used by `clamav-rest-api` to display information about requests. More infor can be found [here](https://github.com/expressjs/morgan#predefined-formats)
- `APP_MAX_FILE_SIZE` - max size (in bytes) of **single** file which will be accepted by `clamav-rest-api`. You have to also take care of `MaxScanSize`, `MaxFileSize`, etc. in your `clamd.conf` file.
- `APP_MAX_FILES_NUMBER` - maximum number of files uploaded to scan
- `CLAMD_IP` - ClamAV IP adress
- `CLAMD_PORT` - ClamAV listen port
- `CLAMD_TIMEOUT`- ClamAV timeout connection in miliseconds
- `SRV_TIMEOUT` - `clamav-reset-api` server timeout in miliseconds
- `UNIX_SOCKET_MODE` - use unix socket instead of TCP
- `CERT_PATH` - SSL Certificate file path
- `KEY_PATH` - SSL Certificate key path

As stated before you can set all those parameters by setting environment variables:

_Linux/MacOSX_

```
source ENV
npm start
```


#### API endpoints

There are only two API endpoints:

`POST /api/v1/scan` - to scan files (see [examples](#Examples))

`GET /api/v1/version` - to get ClamAV version

#### Examples

##### wget example

Oooops: _Wget does not currently support "multipart/form-data" for transmitting POST data_

##### curl example

```
❯ curl -s -k -XPOST https://localhost:19443/api/v1/scan -F FILES=@src/tests/1Mfile01.rnd -F FILES=@src/tests/eicar_com.zip | jq
{
  "success": true,
  "data": {
    "result": [
      {
        "name": "1Mfile01.rnd",
        "is_infected": false,
        "viruses": []
      },
      {
        "name": "eicar_com.zip",
        "is_infected": true,
        "viruses": [
          "Win.Test.EICAR_HDB-1"
        ]
      }
    ]
  }
}
```

##### httpie example

```
❯ https --verify no --form POST https://localhost:19443/api/v1/scan FILES@src/tests/1Mfile01.rnd FILES@src/tests/eicar_com.zip
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Connection: keep-alive
Content-Length: 172
Content-Type: application/json; charset=utf-8
Date: Sun, 07 Jun 2020 10:11:34 GMT
ETag: W/"ac-dmIyPllIezz2lPUbemX0zYljm9w"
X-Powered-By: Express

{
    "data": {
        "result": [
            {
                "is_infected": false,
                "name": "1Mfile01.rnd",
                "viruses": []
            },
            {
                "is_infected": true,
                "name": "eicar_com.zip",
                "viruses": [
                    "Win.Test.EICAR_HDB-1"
                ]
            }
        ]
    },
    "success": true
}
```

##### Postman example

![Postman](./docs/images/Postman.png)

##### Client and server side examples

Simple examples how to call `clamav-rest-api` (from client/browser side) using form action and axios library can be found in [examples/html](./examples/html) directory.

Server side examples (Node.js) using axios, fetch and request library can be found in [examples/nodejs](./examples/nodejs) directory.

There is also simple Python [example](./examples/python) using `requests` library.
