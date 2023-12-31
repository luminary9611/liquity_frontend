#!/bin/bash

rm -rf ./build
cp -rf ../packages/dev-frontend/dist build
rm -rf ./build/icons
rm ./build/robots.txt

find ./build -iname "*.map" -delete
find ./build -iname "*.txt" -delete

LINES=""

for t in "js" "css"; do
    P="build/assets"
    for s in $P/*.$t; do
        gzip -n9 $s
        read -r -d '' LINE << EOT
add_asset(
        &["/${s/build\//}"],
        vec![
            ("Content-Type".to_string(), "text/${t/js/javascript}".to_string()),
            ("Content-Encoding".to_string(), "gzip".to_string()),
            ("Cache-Control".to_string(), "public".to_string()),
        ],
        include_bytes!("../../$s.gz").to_vec(),
    );
EOT
    LINES="$LINES
$LINE"
    done
done

LINES="$LINES
$LINE"

cat <<EOT >src/imtbl/asset_loader.rs
// THIS FILE IS AUTO-GENERATED BY update_assets.sh!

use crate::add_asset;

pub fn load_dynamic_assets() {

$LINES

}
EOT
