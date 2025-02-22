# Penguin: AI Chatbot

An assistant interface for GNOME powered by LLM APIs. Supports Anthropic, OpenAI, and Gemini.

>
> ### **TODO**:
>
> *   Automatically focus the input field on window open
> *   Enable partial message selection (remove left-click copy)
> *   Implement streaming responses
> *   Allow chat window resizing
> *   Add a provider selector in the chat window
> *   Show a chat history selector
> *   Add quick copy buttons for code blocks

# Download & Installation

You can download the latest version of the extension from the [GitHub Releases](https://github.com/esauvisky/Penguin-AI-Chatbot-for-GNOME/releases) page.  Download the `.zip` file from the latest release, and then install it using the following command:

```bash
gnome-extensions install penguin-ai-chatbot@coffeecionado.gitlab.io.shell-extension.zip --force
```

You may need to restart GNOME Shell after installation (log out and log back in, or press Alt+F2, type `r`, and press Enter).

## Manual Installation (from Source)

If you prefer to build the extension from source, follow these steps:

1.  Clone the repository:

    ```bash
    git clone https://github.com/esauvisky/Penguin-AI-Chatbot-for-GNOME.git
    cd Penguin-AI-Chatbot-for-GNOME
    ```

2.  Build, install and enable the extension:

    ```bash
    make
    ```

# Getting Started

This extension now supports multiple LLM providers.  You will need to obtain an API key from your chosen provider(s):

*   **Anthropic:** Sign up and get your API key from [here](https://console.anthropic.com/account/keys).
*   **OpenAI:** Sign up and get your API key from [here](https://platform.openai.com/api-keys).
*   **Gemini:** Sign up and get your API key from [here](https://makersuite.google.com/app/apikey).

Once you have your API key(s):

1.  Install the extension.
2.  Open the extension settings.
3.  Select your preferred LLM provider.
4.  Paste your API key into the corresponding field.
5.  Choose your desired model (refer to the provider's documentation for available models).
6.  (Optional) Customize the colors for your messages and the chatbot's messages.
7.  (Optional) Set a keyboard shortcut to quickly open the chat window.
8. Click Save.

You can now use the extension! Open the chat window by clicking the Penguin icon in the top panel or by using the keyboard shortcut (default: Super+L).

# Features

*   **Multiple LLM Providers:** Choose between Anthropic, OpenAI, and Gemini.
*   **Customizable Models:** Select different models for each provider.
*   **Chat History:** Remembers your conversation history.
*   **Customizable Appearance:** Change the background and text colors for messages.
*   **Keyboard Shortcut:** Quickly open the chat window with a customizable shortcut.
*   **Copy to Clipboard:** Click on any message to copy it to your clipboard.

# Showcase

![Screenshot of Penguin as a GNOME Shell Extension](public/screenshot.png)
![Screenshot of Penguin as a GNOME Shell Extension](public/fullscreen.png)
