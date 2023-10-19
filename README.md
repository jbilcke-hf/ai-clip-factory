---
title: Clip Factory
emoji: 🤙
colorFrom: blue
colorTo: yellow
sdk: docker
pinned: true
app_port: 3000
---

# The AI Clip Factory

The AI Clip Factory is a space to create animated videos in an ultra simple and fun way. It is meant to be a child's play.

## Text-to-video model

The AI Clip Factory is a space about clip generation and providing a fun UI, and is not meant to promote a specific AI model.

As a consequence, a model currently defined as default may be replaced at anytime by a newer SOTA model.

Right now (2023-10-19) the default model is the base Hotshot-XL (use the official website for faster inference at [https://hotshot.co](https://hotshot.co)).

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


