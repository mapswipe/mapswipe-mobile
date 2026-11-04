import { isDefined } from '@togglecorp/fujs';

import { type FbObjRasterTileServer } from '@/utils/types';

interface ValidateImagerySource {
    tileServer: FbObjRasterTileServer;
    preEventTileServer?: FbObjRasterTileServer;
    postEventTileServer?: FbObjRasterTileServer;
}

function getValidateTileServers(source: ValidateImagerySource) {
    const postEvent = source.postEventTileServer ?? source.tileServer;
    const preEvent = source.preEventTileServer;

    return isDefined(preEvent) ? [preEvent, postEvent] : [postEvent];
}

export default getValidateTileServers;
