============ PLUGIN EXAMPLES ============ 

1. Sitemap:

sitemap: {
    isShow: false, // enable it or not
    isMultiFlows: false // whether for multiflows sitemap or single flow sitemap
}

2. Menu: (1 or 2 levels menu)

menu: {
    isShow: true, // enable it or not
    hasImage: true, // whether menu has thumbnail image
    useDoubleTap: true, // enable double tap (tapone for showing submenu, doubletap for go to that slide)
    thumbPath: 'thumbnails', // the path for thumbnail images
    submenu: {
        isShow: true, // enable submenu or not
        hasImage: true, // whether submenu has thumbnail image
        thumbPath: 'thumbnails', // path for thumbnail images
		layout: 'vertical' // layout for submenu (horizontal or vertical)
    }
}

3. Style menu: (multi-levels menu - experiment only)

stylemenu: {
	isShow: true // enable it or not
}





