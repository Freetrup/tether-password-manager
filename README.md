# TetherPass

A peer-to-peer password manager built on [Pear](https://docs.pears.com) and [Autopass](https://github.com/holepunchto/autopass). No server and no accounts: vaults live on your devices and sync directly between them.

**Pear link:** `pear://zmc1uz3cqetqk7dyqcyih5tph39osw8njhxuaxjzmftca9zksshy`

## Features

- **Multiple vaults.** Create as many vaults as you like (for example "Personal", "Family", "Work"). Each vault is a separate Autopass instance with its own storage, so you can share one vault without exposing the others.
- **Passwords.** Title, password, URL, note and any number of custom fields. Copy the password or URL in one click, show or hide the password, edit and delete with confirmation.
- **Search and pagination.** Search by title, note or URL. Matching is case- and accent-insensitive and works word by word. Results are paginated at 5 per page; the pager only appears when there is more than one page, and a new search jumps back to page 1.
- **Live sync.** Every change, whether local or from another device, triggers Autopass `update`. The worker re-reads the vault and pushes a fresh snapshot to the UI.
- **Sharing.** "Share" creates an invite with **Full access** or **Read only** rights. The dialog waits for the other device, shows its name when it connects, and lets you revoke the invite. Invites are single-use.
- **Joining.** Paste an invite code and the app walks you through each step: _Looking for members → Getting access → Done_. Invalid codes are caught before a request is sent. If nobody answers within 60 seconds, you get a clear error instead of an endless spinner.
- **Read-only vaults.** Joined read-only vaults show a badge and hide every editing action.
- **Health suggestions.** The vault page warns about reused passwords and passwords that have not changed in over three months.
- **Light / dark / system theme**, remembered between launches.

### Creative feature: "Suggest to change password"

A roulette that picks which password you should rotate next. Each password's chance depends on how long ago it was last changed: older passwords are more likely to come up, and every password keeps at least a 5% chance. The wheel shows each entry's odds, spins, lands on a winner, and shows the roll, the chance and the last-changed date. **Change now** opens the edit form for that password.

`passwordChangedAt` is tracked separately from `createdAt`. Editing other fields does not reset a password's age; only changing the password itself does.

## Running it

Requirements: Node.js and npm. The `pear` CLI is only needed to stage or seed the app (`npx pear` also works).

```sh
npm install
npm start
```

`npm start` builds the UI into `renderer/` and then starts the Electron app.

### Trying sync on one machine

Start a second instance with its own storage folder:

```sh
npm start -- --storage ./second-device
```

1. In the first window: **Create** a vault, open it, click **Share** and copy the invite.
2. In the second window: **Join**, paste the code, then **Connect**.
3. Add or edit a password in either window and watch the other one update.

Peers find each other through the public Hyperswarm DHT. If they never connect, it is almost always the network (symmetric NAT or a corporate firewall), not the app: `pear seed <link> --json` shows `natType`.

### Scripts

| Script              | What it does                                                          |
| ------------------- | --------------------------------------------------------------------- |
| `npm run dev`       | Vite dev server with HMR plus Electron pointed at it (opens DevTools) |
| `npm start`         | Build the UI and run the app                                          |
| `npm run typecheck` | TypeScript check of the UI                                            |
| `npm run lint`      | Prettier + lunte                                                      |
| `npm run package`   | Packaged app in `out/`                                                |

## Architecture

Built from the [`hello-pear-electron`](https://github.com/holepunchto/hello-pear-electron) template:

```
renderer (React)  ⇄  window.bridge  ⇄  electron/main.js  ⇄  workers/main.js (Bare)
   ui/src                preload           broker only         Autopass, Corestore, Hyperswarm
```

- **`workers/main.js`** holds all data and P2P logic. It keeps a registry of vaults (`app-storage/vaults.json`) and opens one Corestore + Autopass per vault under `app-storage/vaults/<id>`. It validates every write (required fields, read-only vaults, reserved keys) and closes everything cleanly on exit.
- **IPC protocol.** Plain text frames of the form `command payload`, where `payload` is JSON. UI → worker: `autopass:create`, `:open`, `:delete`, `:add`, `:update`, `:remove`, `:share-create`, `:share-revoke`, `:join`, `:join-cancel`. Worker → UI: `autopass:state` (full snapshot), `:error`, `:share-invite`, `:share-joined`, `:join-status`, `:join-done`, `:join-error`, and others. The template's updater messages are left untouched.
- **UI** (`ui/`): React 19, Redux Toolkit and Tailwind CSS 4, built with Vite. `ui/src/autopass/messages.ts` is the only module that talks to the worker. It maps incoming commands to Redux actions and exposes typed senders. Components read from the store and never touch the bridge directly.
- **Styling.** Colors are CSS variables on `:root` and `.dark`, exposed to Tailwind through `@theme` (`bg-surface`, `text-ink`, `text-muted`, `border-line`, `text-accent`). The dark theme swaps variables instead of using `dark:` on every element. Animations (roulette, entrance transitions) are defined as theme keyframes.

### Data model

Each password is an Autopass record whose key is a random UUID and whose value is JSON:

```json
{
  "title": "GitHub",
  "password": "…",
  "url": "https://github.com",
  "note": "",
  "customFields": [{ "name": "2FA backup", "value": "…" }],
  "createdAt": 1761091200000,
  "passwordChangedAt": 1761091200000
}
```

Keys starting with `tetherpass:` are reserved for app metadata, such as the vault marker written on creation.

## Known limitations

- **No master password.** Autopass encrypts data in its logs and over the wire, but the encryption key is stored next to the data. Anyone with a copy of the storage folder can read the vault. A master password (encrypting values with a key derived from it) is the obvious next step.
- **Conflicts.** If two devices edit the same password while offline, Autobase keeps one version after they sync; there is no merge or history.
- **Sharing needs someone online.** Joining only works while at least one member of the vault is running the app.
- **Member management** is read-only in the UI: the member count is shown, but removing a device is not implemented yet.

## AI usage

As the brief allows, I used an AI assistant (Claude) for:

- **Project setup.** Bringing in the `hello-pear-electron` template, installing Autopass, wiring Vite + React + Redux Toolkit + Tailwind into the renderer, the `window.bridge` typings and the initial store skeleton.
- **Remove all console logs and dummy data** there was too much and i just deleted it in a couple promts
- **Learning the stack.** Explanations of Pear, Bare, Hyperswarm and Autopass (API, pairing, storage and encryption), partly by reading the library source (I'm seeing thos librarys first time).
- **This README**, drafted from the code and edited by me.
- **commit name** I just love to click this button sorry

The application code is my own: the worker and Autopass integration, the IPC protocol, state management, components, styling, and the roulette feature.

## Killer feature

I've added a roulette to pick a password to edit, because you should change them pretty often (first idea was to not allow user to close this modal, but it was too radical)

## Questinable desicions

- **Tailwind** It was a limited time so I used emmet and tailwind ui to speed up the process and to not overload you with lots of files. It's not prod ready solution and in a long term will kill everything

- **No memo/callbacks** now react compiler can do it in auto mode

- **UX is strange** I have never used such systems in my life so I had no idea what to implement, sorry

