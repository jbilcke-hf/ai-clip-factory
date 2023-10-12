---
title: Hotshot-XL Text-to-GIF
emoji: 🤙
colorFrom: blue
colorTo: yellow
sdk: docker
pinned: true
app_port: 3000
---

#  Hotshot-XL Text-to-GIF


## Setup

If you run the app locally you need to create a `.env.local` file 
(If you deploy to Hugging Face, just set the environment variable from the settings)

### Video rendering engine

Note: the app is in heavy development, not all backends are supported

Set `VIDEO_ENGINE` to one of:

- `VIDEO_ENGINE="VIDEO_HOTSHOT_XL_API_GRADIO"`
- `VIDEO_ENGINE="VIDEO_HOTSHOT_XL_API_REPLICATE"`
- `VIDEO_ENGINE="VIDEO_HOTSHOT_XL_API_NODE"` <- not working yet
- `VIDEO_ENGINE="VIDEO_HOTSHOT_XL_API_OFFICIAL"` <- not working yet


### Authentication

If you intent to use a special provider (eg. Replicate) you need to setup your token

- `AUTH_REPLICATE_API_TOKEN="<YOUR SECRET>"`


