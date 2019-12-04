# https://bookdown.org/brry/rdwd/use-case-recent-hourly-radar-files.html

# Download and install (once only):
install.packages("rdwd")

# Load the package into library (needed in every R session):
library(rdwd)



ry_base<- "ftp://ftp-cdc.dwd.de/weather/radar/radolan/ry/"
ry_urls <- indexFTP(base=rw_base, dir=tempdir(), folder="", quiet=TRUE)

# last uploaded file: ry_urls[length(ry_urls)]
# Error in sapply(force, isFALSE) : object 'isFALSE' not found
ry_file <- dataDWD(file=ry_urls[length(ry_urls)], base=ry_base, joinbf=TRUE, dir=tempdir(), read=FALSE, quiet=TRUE, dbin=TRUE)

ry_orig <- dwdradar::readRadarFile(ry_file)

# plot result
raster::plot(rw_proj) # NB: is rw file, but needs radolan extent instead of rw
addBorders()
