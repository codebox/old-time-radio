export type ArchiveOrgMetadata = {
    alternate_locations: {
        servers: [
            {
                "server": string,
                "dir": string,
            }
        ],
            "workable": [
            {
                "server": string,
                "dir": string,
            }
        ]
    },
    "d1": string,
    "d2": string,
    "dir": string,
    "files": [
        {
            "name": string,
            "format": string,
            "length": string,
        }
    ],
    "server": string,
    "workable_servers": [string]
}