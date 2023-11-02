# media-server

This project is a basic express server image resizer "proxy" coupled with Google Storage API.
The main goal of this project is to reduce the payload served to users. We also make use of heavy caching on Cloud Flare to be sure images aren't processed more than once.

## development

the main development branch is `develop`, whenever it is merged an automatic service deployment to staging happens. similarly when a `release`is performed, the main production service is deployed.

the code should be formatted with standard prettier config, even though there are no active linters configured currently.
