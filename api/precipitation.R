# https://bookdown.org/brry/rdwd/use-case-recent-hourly-radar-files.html

# load packages
needs(dplyr)
needs(rdwd)
needs(dwdradar)
needs(raster)
# needs(leafletR)
needs(sp)
needs(rgeos)
needs(magrittr)
# needs(geojsonR)

attach(input[[1]])

# stop("bis hier", call. = TRUE)

dwd_url <- "ftp://ftp-cdc.dwd.de/weather/radar/radolan/"
#rw_base <- "ftp://ftp-cdc.dwd.de/weather/radar/radolan/rw"

rw_base <- "ftp://ftp-cdc.dwd.de/weather/radar/radolan/sf"

# set url
rw_urls <- indexFTP(base=rw_base, dir=tempdir(), folder="", quiet=TRUE)
rw_file <- dataDWD(rw_urls[length(rw_urls)], base=rw_base, joinbf=TRUE, dir=tempdir(), read=FALSE, quiet=TRUE, dbin=TRUE)


# get data and reproject
rw_orig <- dwdradar::readRadarFile(rw_file)
rw_proj <- projectRasterDWD(raster::raster(rw_orig$dat), extent="radolan", quiet=TRUE)

# replace values <= 0 with NA, so they wont be calculated
rw_proj[rw_proj == 0] <- NA
rw_proj[rw_proj < 0] <- NA

## classification
# summed up statistics
sum = summary(rw_proj)

tmp <- tempdir()

radartif <- writeRaster(rw_proj, filename=file.path(tmp, "rain.tif"))

meta <- vector("list", 2)

extent <- c(radartif@extent@xmin, radartif@extent@xmax, radartif@extent@ymin, radartif@extent@ymax)

meta[[1]] <- radartif@file@name
meta[[2]] <- extent

result <- meta