import { alerts, getAlertIds } from "../../main.js";

const commands = [];

setTimeout(() => {
    setupCommands()
}, 500);

function setupCommands() {

    if (alerts.watchlist.enabled) commands.push({
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
    })

    const alertIds = getAlertIds();
    const notifyCommand = {
        name: 'notify',
        description: 'Set notifications for specific alerts',
        options: []
    }

    notifyCommand.options = alertIds.map(alert => {
        return {
            name: alert.toLowerCase(),
            type: 5,
            description: `Send a ping for me when a ${alert} happens.`,
            required: false,
        }
    })

    commands.push(notifyCommand);
}

export default commands;