# https://bookdown.org/brry/rdwd/use-case-recent-hourly-radar-files.html

# load packages
library(rdwd)
library(dwdradar)
library(raster)
library(leafletR)


rw_base <- "ftp://ftp-cdc.dwd.de/weather/radar/radolan/rw"

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

# unit: 1/10 mm/h, thus *10 for mm/h values (breaks have been devided by 10)
reclass = c(0,0.25,1, 0.25,1,2, 1,5,3, 5,10000,4)

# build matrix
reclass_m = matrix(reclass,
                   ncol = 3,
                   byrow = TRUE)
# reclass
rw_proj_class = reclassify(rw_proj, reclass_m)

# convert raster to Polygons with given classes
pol = rasterToPolygons(rw_proj_class, n = 4, na.rm = TRUE, dissolve = TRUE)#

# convert SpatialPolygonsDataFrame to GeoJSON
geojson <- tempfile()
toGeoJSON(pol, name=basename(geojson), dest=tempdir())