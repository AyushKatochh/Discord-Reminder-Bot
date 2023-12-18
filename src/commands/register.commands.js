import dotenv from 'dotenv';
dotenv.config();
import { REST } from '@discordjs/rest';
import { Routes, ApplicationCommandOptionType } from 'discord-api-types/v10';


const composeCommand = {
  name: 'reminder',
  description: 'Compose a reminder',
  type: 1, // SUB_COMMAND
  options: [
    {
      name: 'dm',
      description: 'Send reminder via DM?',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: 'Yes',
          value: 'Yes',
        },
        {
          name: 'No',
          value: 'No',
        },
      ],
    },
    {
      name: 'channel',
      description: 'Select the channel for the reminder',
      type: ApplicationCommandOptionType.Channel, // Use Channel type
      required: false,
    },
    {
      name: 'text',
      description: 'The title of the reminder',
      type: 3, // String type
      required: false,
    },
    {
      name: 'time',
      description: 'The description and date for the reminder',
      type: 3, // String type
      required: false,
    },
  ],
};

const remindIn20MinutesCommand = {
  name: "Remind-in-20-minutes",
  type: 3, // SUB_COMMAND
};

const remindIn1HourCommand = {
  name: "Remind-in-1-hour",
  type: 3, // SUB_COMMAND
};

const remindIn2HoursCommand = {
  name: "Remind-in-2-hours",
  type: 3, // SUB_COMMAND
};

const remindAfter1WeekCommand = {
  name: "Remind-after-1-week",
  type: 3, // SUB_COMMAND
};

const remindTomorrowCommand = {
  name: "Remind-tomorrow",
  type: 3, // SUB_COMMAND
};

const commands = [
  composeCommand,
  remindIn20MinutesCommand,
  remindIn1HourCommand,
  remindIn2HoursCommand,
  remindAfter1WeekCommand,
  remindTomorrowCommand,
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');

    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
      body: commands,
    });

    console.log('Slash commands were registered successfully');
  } catch (error) {
    console.log(`There was an error ${error}`);
  }
})();
