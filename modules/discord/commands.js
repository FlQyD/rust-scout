const commands = [
    {
        name: 'watchlist',
        description: 'Adds a player to the watchlist!',
        options: [
            {
                name: 'bm-id-or-steam-id',
                type: 3,
                description: 'The Steam ID of the player',
                required: true,
            },
            {
                name: 'notify',
                type: 3,
                description: 'Who should be notified if the player joins?',
                required: false,
                choices: [
                    {
                        name: 'Only me - Default',
                        value: 'only-me',
                    },
                    {
                        name: 'Staff team',
                        value: 'staff',
                    },
                ],
            },
            {
                name: 'note',
                type: 3,
                description: 'Note on why this player on the watchlist',
                required: false,
            },
            {
                name: 'action',
                type: 3,
                description: 'Add or remove the player form the watchlist',
                required: false,
                choices: [
                    {
                        name: 'Add - Default',
                        value: 'add',
                    },
                    {
                        name: 'Remove',
                        value: 'remove',
                    },
                ],
            },
        ],
    },
    {
        name: 'notify',
        description: 'Set notifications for specific events',
        options: [
            {
                name: 'mass-reported-abusive',
                type: 5,
                description: 'Notify if the player is mass-reported for abusive behavior',
                required: false,
            },
            {
                name: 'mass-reported-cheating',
                type: 5,
                description: 'Notify if the player is mass-reported for cheating',
                required: false,
            },
            {
                name: 'sus-cheating',
                type: 5,
                description: 'Notify if the player is suspected of cheating',
                required: false,
            },
            {
                name: 'possible-rgb-account-found',
                type: 5,
                description: 'Notify if there is a possible banned alt account connected to a player.',
                required: false,
            },
        ],
    },
];

export default commands;
