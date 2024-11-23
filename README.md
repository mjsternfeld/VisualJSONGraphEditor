This React app is used to create, visualize and edit JSON files that follow the JSON format used in dialog trees in my Unity RPG (work in progress).

Installation
- npm run install
- npm run build


optional: build as standalone Desktop application using Electron
- For Windows: npm run build:win
- For Linux: npm run build:linux



Features:
- Visualize dialog trees by importing JSON files following this structure
- Edit these trees by selecting NPC nodes (green) and adjusting the values of its fields (and its player response nodes' fields)
- Create new trees from scratch by creating new NPC nodes, adding Player nodes to them and linking them by setting their IDs
- Export trees as .json files



The JSON follows this structure: 

- nodes: the main array of nodes (NPC dialog lines)

Each node contains the following attributes:
- id: a unique identifier (integer)
- npcDialog: the NPC's dialog line (string)
- choices: an array of choice objects (the possible responses the player can give to the node)

Each choice object contains the following fields:
- choiceId: a unique identifier for that choice node (integer) 
- nextNodeID: the id of the NPC dialog node this choice leads to (i.e., what the NPC will respond to this player dialog line) (integer)
- playerResponse: the player dialog line (string)
- seen: a boolean to indicate whether the dialog line has been used already (set to true in the game, not relevant in this app - always set to false)
- parentId: the id of the NPC node this line is a response to (integer)
- companionReaction: an enum / string ("hate", "dislike", "neutral", "like", "love") to adjust the relationship with the player's companion character
- dqt / dqc: dialog quest trigger / quest condition fields used to interact with the game's quest system (in this app, they are initialized as {} and need to be set manually)
- isExit: boolean to indicate whether this is an exit node, i.e., if this choice should end the dialog

Example:

{
  "nodes": [
    {
      "id": 1,
      "npcDialog": "The NPC dialog line",
      "choices": [
        {
          "choiceId": 1,
          "nextNodeID": "2",
          "playerResponse": "This is one possible way the player can respond to the NPC dialog line with id 1",
          "seen": false,
          "parentId": "1",
          "companionReaction": "neutral",
          "dqt": {},
          "dqc": {},
          "isExit": false
        },
        {
          "choiceId": 2,
          "nextNodeID": -1,
          "playerResponse": "This is another way the player can respond to the NPC dialog line with id 1. This is also an exit node, to end the dialog completely.",
          "seen": false,
          "parentId": "1",
          "companionReaction": "dislike",
          "dqt": {},
          "dqc": {},
          "isExit": true
        }
      ]
    },
    {
      "id": 2,
      "npcDialog": "I need your help! Will you accept my quest?",
      "choices": [
        {
          "choiceId": 3,
          "nextNodeID": -1,
          "playerResponse": "Enter your player dialog here",
          "seen": false,
          "parentId": "2",
          "companionReaction": "neutral",
          "dqt": {},
          "dqc": {},
          "isExit": false
        }
      ]
    }
  ]
}