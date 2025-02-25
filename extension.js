// Made by contributors to https://github.com/martijara/Penguin-AI-Chatbot-for-GNOME

// Importing necessary libraries
import GObject from 'gi://GObject';
import St from 'gi://St';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import Pango from 'gi://Pango';
import {convertMD} from "./md2pango.js";

import * as Main from 'resource:///org/gnome/shell/ui/main.js';


// Defining necessary variables (LLM API)
let LLM_PROVIDER = "";
let ANTHROPIC_API_KEY = "";
let OPENAI_API_KEY = "";
let GEMINI_API_KEY = "";
let LLM_MODEL = "";
let OPENAI_MODEL = "";
let GEMINI_MODEL = "";
let OPENROUTER_MODEL = ""
let OPENROUTER_API_KEY = ""

let HISTORY = [];
let BACKGROUND_COLOR_HUMAN_MESSAGE = "";
let BACKGROUND_COLOR_LLM_MESSAGE = "";
let COLOR_HUMAN_MESSAGE = "";
let COLOR_LLM_MESSAGE = ""
let url = ""; // Placeholder, will be set dynamically



// Class that activates the extension
const Penguin = GObject.registerClass(
class Penguin extends PanelMenu.Button
{


    _loadSettings () {
        this._settingsChangedId = this.extension.settings.connect('changed', () => {
            this._fetchSettings();
        });
        this._fetchSettings();
    }

    _fetchSettings () {
        const { settings } = this.extension;
        LLM_PROVIDER = settings.get_string("llm-provider");

        ANTHROPIC_API_KEY = settings.get_string("anthropic-api-key");
        OPENAI_API_KEY = settings.get_string("openai-api-key");
        GEMINI_API_KEY = settings.get_string("gemini-api-key");
        OPENROUTER_API_KEY = settings.get_string("openrouter-api-key");

        LLM_MODEL = settings.get_string("anthropic-model");
        OPENAI_MODEL = settings.get_string("openai-model");
        GEMINI_MODEL = settings.get_string("gemini-model");
        OPENROUTER_MODEL = settings.get_string("openrouter-model");
        

        BACKGROUND_COLOR_HUMAN_MESSAGE = settings.get_string("human-message-color");
        BACKGROUND_COLOR_LLM_MESSAGE = settings.get_string("llm-message-color");

        COLOR_HUMAN_MESSAGE = settings.get_string("human-message-text-color");
        COLOR_LLM_MESSAGE = settings.get_string("llm-message-text-color");

        HISTORY = JSON.parse(settings.get_string("history"));
    }

    _init(extension) {
        // --- INITIALIZATION AND ICON IN TOPBAR
        super._init(0.0, _('Penguin: AI Chatbot'));
        this.extension = extension
        this._loadSettings();

        this.add_child(new St.Icon({
            icon_name: 'Penguin: AI Chatbot',
            style_class: 'icon',
        }));


        // ... INITIALIZATION OF SESSION VARIABLES
        this.history = []
        this._httpSession = new Soup.Session();
        this.timeoutCopy = null
        this.timeoutResponse = null
        this.timeoutFocusInputBox = null;


        // --- EXTENSION FOOTER
        this.chatInput = new St.Entry({
            hint_text: "Chat with me",
            can_focus: true,
            track_hover: true,
            style_class: 'messageInput'
        });

        // Enter clicked
        this.chatInput.clutter_text.connect('activate', (actor) => {
            if (this.timeoutResponse) {
                GLib.Source.remove(this.timeoutResponse);
                this.timeoutResponse = null;
            }

            let input = this.chatInput.get_text();


            this.initializeTextBox('humanMessage', input, BACKGROUND_COLOR_HUMAN_MESSAGE, COLOR_HUMAN_MESSAGE)

            // Add input to chat history
            this.history.push({
                "role": "user",
                "content": input
            });

            this.llmChat(); // Changed function name

            this.chatInput.set_reactive(false)
            this.chatInput.set_text("I am Thinking...")
        });

        this.newConversation = new St.Button({
            style: "width: 16px; height:16px; margin-right: 15px; margin-left: 10px'",

            child: new St.Icon({
                icon_name: 'tab-new-symbolic',
                style: 'width: 30px; height:30px'})
        });
        this.menu.connect('open-state-changed', (self, open) => {
            if (open) {
                this._focusInputBox();
            }
        });
        this.newConversation.connect('clicked', (actor) => {
            if (this.chatInput.get_text() == "Create a new conversation (Deletes current)" ||  this.chatInput.get_text() != "I am Thinking...") {
                this.history = []

                const { settings } = this.extension;
                settings.set_string("history", "[]");

                this.chatBox.destroy_all_children()
            }
            else {

                this.initializeTextBox('llmMessage', "You can't create a new conversation while I am thinking", BACKGROUND_COLOR_LLM_MESSAGE, COLOR_LLM_MESSAGE);
            }
        });

        this.newConversation.connect('enter-event', (actor) => {
            if (this.chatInput.get_text() == "") {
                this.chatInput.set_reactive(false)
                this.chatInput.set_text("Create a new conversation (Deletes current)")
            }
        });

        this.newConversation.connect('leave-event', (actor) => {
            if (this.chatInput.get_text() == "Create a new conversation (Deletes current)") {
                this.chatInput.set_reactive(true)
                this.chatInput.set_text("")
            }
        });


        let entryBox = new St.BoxLayout({
            vertical: false,
            style_class: 'popup-menu-box'
        });

        entryBox.add_child(this.chatInput);
        entryBox.add_child(this.newConversation);




        // --- EXTENSION BODY
        this.chatBox = new St.BoxLayout({
            vertical: true,
            style_class: 'popup-menu-box',
            style: 'text-wrap: wrap'
        });

        this.chatInput.set_reactive(false)
        this.chatInput.set_text("Loading history...")
        this._loadHistory();

        this.chatView = new St.ScrollView({
            enable_mouse_scrolling: true,
            style_class: 'chat-scrolling',
            reactive: true
        });

        this.chatView.set_child(this.chatBox);


        // tab-new-symbolic


        // --- EXTENSION PARENT BOX LAYOUT

        let layout = new St.BoxLayout({
            vertical: true,
            style_class: 'popup-menu-box'
        });

        layout.add_child(this.chatView);
        layout.add_child(entryBox);


        // --- ADDING EVERYTHING TOGETHER TO APPEAR AS A POP UP MENU
        let popUp = new PopupMenu.PopupMenuSection();
        popUp.actor.add_child(layout);

        this.menu.addMenuItem(popUp);

        this._bindShortcut();
    };

    _bindShortcut() {
        let shortcut = this.extension.settings.get_strv('open-chat-shortcut')[0];
        if (shortcut) {
            Main.wm.addKeybinding(
                'open-chat-shortcut',
                this.extension.settings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
                this._toggleChatWindow.bind(this)
            );
        }
    }

    _unbindShortcut() {
        Main.wm.removeKeybinding('open-chat-shortcut');
    }

    _focusInputBox() {
        if (!this.timeoutFocusInputBox) {
            console.log("lol");
            this.timeoutFocusInputBox = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50, () => {
                this.chatInput.grab_key_focus();
                this.timeoutFocusInputBox = null;
                return GLib.SOURCE_REMOVE;
            });
        }
    }

    _toggleChatWindow() {
        if (this.menu.isOpen) {
            this.menu.close();
        } else {
            this.menu.open();
            this._focusInputBox();
        }
    }

    _loadHistory() {
        this.history = HISTORY

        this.history.forEach(json => {
            if (json.role == "user") {
                this.initializeTextBox("humanMessage", convertMD(json.content), BACKGROUND_COLOR_HUMAN_MESSAGE, COLOR_HUMAN_MESSAGE);
            }
            else {
                this.initializeTextBox("llmMessage", convertMD(json.content), BACKGROUND_COLOR_LLM_MESSAGE, COLOR_LLM_MESSAGE);
            }
        });

        this.chatInput.set_reactive(true)
        this.chatInput.set_text("")
        this._focusInputBox();

        return;
    }


    llmChat() {
        let apiKey = "";
        let requestBody = {};
        let message;

        if (LLM_PROVIDER === "anthropic") {
            LLM_MODEL = this.extension.settings.get_string("anthropic-model");
            url = `https://api.anthropic.com/v1/messages`;
            message = Soup.Message.new('POST', url);
            apiKey = ANTHROPIC_API_KEY;
            message.request_headers.append(
                'x-api-key',
                apiKey
            );
            message.request_headers.append(
                'anthropic-version',
                '2023-06-01'
            );

            requestBody = {
                "model": LLM_MODEL,
                "messages": this.history.map(msg => ({
                    role: msg.role === "user" ? "user" : "assistant",
                    content: msg.content
                })),
                "max_tokens": 1024
            };


        } else if (LLM_PROVIDER === "openai") {
            LLM_MODEL = this.extension.settings.get_string("openai-model");
            url = `https://api.openai.com/v1/chat/completions`;
            apiKey = OPENAI_API_KEY;
            message = Soup.Message.new('POST', url);

            message.request_headers.append(
                'Authorization',
                `Bearer ${apiKey}`
            );

            requestBody = {
                "model": LLM_MODEL,
                "messages": this.history.map(msg => ({
                    role: msg.role === "user" ? "user" : "assistant",
                    content: msg.content
                })),
                "response_format": {
                    "type": "text"
                },
                "temperature": 1,
                "max_completion_tokens": 4096,
                "top_p": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0
            };


        } else if (LLM_PROVIDER === "gemini") {
            LLM_MODEL = this.extension.settings.get_string("gemini-model");
            url = `https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
            message = Soup.Message.new('POST', url);

            requestBody = {
                "contents": this.history.map(msg => ({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.content }]
                })),
                "generationConfig": {
                    "temperature": 1,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 8192,
                    "responseMimeType": "text/plain"
                }
            };
        } else if (LLM_PROVIDER === "openrouter") {
            LLM_MODEL = this.extension.settings.get_string("openrouter-model");
            url = `https://openrouter.ai/api/v1/chat/completions`;
            message = Soup.Message.new('POST', url);

            message.request_headers.append(
                'Authorization',
                `Bearer ${OPENROUTER_API_KEY}`);


            requestBody = {
                "messages": this.history,
                "model": OPENROUTER_MODEL
                
                }
            }
        
        else {

            url = `https://api.anthropic.com/v1/messages`;
            apiKey = ANTHROPIC_API_KEY;
            LLM_MODEL = this.extension.settings.get_string("anthropic-model");
        }


        message.request_headers.append(
            'content-type',
            'application/json'
        );


        let body = JSON.stringify(requestBody);
        let bytes = GLib.Bytes.new(body);

        message.set_request_body_from_bytes('application/json', bytes);

        this._httpSession.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null,
            (session, result) => {
                try {
                    if (message.get_status() === Soup.Status.OK) {
                        const bytes = session.send_and_read_finish(result);
                        const decoder = new TextDecoder('utf-8');
                        const response = JSON.parse(decoder.decode(bytes.get_data()));

                        let assistantMessage = "";

                        if (LLM_PROVIDER === "anthropic") {
                            assistantMessage = response.content[0].text;
                        } else if (LLM_PROVIDER === "openai") {
                            assistantMessage = response.choices[0].message.content;
                        } else if (LLM_PROVIDER === "gemini") {
                            assistantMessage = response.candidates[0].content.parts[0].text;
                        } else if (LLM_PROVIDER === "openrouter") {
                            assistantMessage = response.choices[0].message.content;
                        }


                        this.history.push({
                            "role": "assistant",
                            "content": assistantMessage
                        });

                        this.initializeTextBox('llmMessage', convertMD(assistantMessage), BACKGROUND_COLOR_LLM_MESSAGE, COLOR_LLM_MESSAGE);

                        // Save updated history
                        const { settings } = this.extension;
                        settings.set_string("history", JSON.stringify(this.history));
                    } else {
                        let errorMessage = `Hmm, an error occured when trying to reach out to the assistant.\nCheck your API key and model settings for ${LLM_PROVIDER} and try again. It could also be your internet connection!`;
                        this.initializeTextBox('llmMessage', errorMessage, BACKGROUND_COLOR_LLM_MESSAGE, COLOR_LLM_MESSAGE);

                        let settingsButton = new St.Button({
                            label: "Click here to go to settings", can_focus: true,  toggle_mode: true
                        });
                    
                        settingsButton.connect('clicked', (self) => {
                            this.openSettings();
                        });
            
                        this.chatBox.add_child(settingsButton)
                    }
                } catch (error) {
                    let errorMessage = `We are having trouble getting a response from the assistant. \nHere is the error - if it helps at all: \n\n${error} \n\nSome tips:\n\n- Check your internet connection\n- If you recently changed your provider, try deleting your history.`;
                    this.initializeTextBox('llmMessage', errorMessage, BACKGROUND_COLOR_LLM_MESSAGE, COLOR_LLM_MESSAGE);

                    let settingsButton = new St.Button({
                        label: "Click here to go to settings", can_focus: true,  toggle_mode: true
                    });
                
                    settingsButton.connect('clicked', (self) => {
                        this.openSettings();
                    });
        
                    this.chatBox.add_child(settingsButton)

                    logError(error);
                }

                this.chatInput.set_reactive(true);
                this.chatInput.set_text("");
                this._focusInputBox();
            }
        );

        return;
    }

    initializeTextBox(type, text, color, textColor) {
        let box = new St.BoxLayout({
            vertical: true,
            style_class: `${type}-box`
        });

        // text has to be a string
        let label = new St.Label({
            style_class: type,
            style: `background-color: ${color}; color: ${textColor}`,
            y_expand: true,
            reactive: true
        });

        label.clutter_text.single_line_mode = false;
        label.clutter_text.line_wrap        = true;
        label.clutter_text.line_wrap_mode   = Pango.WrapMode.WORD_CHAR;
        label.clutter_text.ellipsize        = Pango.EllipsizeMode.NONE;

        box.add_child(label)

        if(type != 'humanMessage') {
            label.connect('button-press-event', (actor) => {
                this.extension.clipboard.set_text(St.ClipboardType.CLIPBOARD, label.clutter_text.get_text());
            });



            label.connect('enter-event', (actor) => {


                if (this.chatInput.get_text() == "") {
                    this.timeoutCopy = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 0.4, () => {
                        this.chatInput.set_reactive(false);
                        this.chatInput.set_text("Click on text to copy");});
                }
            });

            label.connect('leave-event', (actor) => {
                if (this.timeoutCopy) {
                    GLib.Source.remove(this.timeoutCopy);
                    this.timeoutCopy = null;
                }

                if (this.chatInput.get_text() == "Click on text to copy") {
                    this.chatInput.set_reactive(true);
                    this.chatInput.set_text("");
                }
            });

        }

        label.clutter_text.set_markup(text);
        this.chatBox.add_child(box);
    }

    openSettings () {
        this.extension.openSettings();
    }

    destroy() {
        if (this.timeoutCopy) {
            GLib.Source.remove(this.timeoutCopy);
            this.timeoutCopy = null;
        }

        if (this.timeoutResponse) {
            GLib.Source.remove(this.timeoutResponse);
            this.timeoutResponse = null;
        }

        this._unbindShortcut();
        this._httpSession?.abort();
        HISTORY = null;
        super.destroy();
    }

});


export default class PenguinExtension extends Extension {
    enable() {
        this._penguin = new Penguin({
            settings: this.getSettings(),
            clipboard: St.Clipboard.get_default(),
            openSettings: this.openPreferences,
            uuid: this.uuid
        });

        Main.panel.addToStatusArea(this.uuid, this._penguin);
    }
    disable() {
        this._penguin.destroy();
        this._penguin = null;
    }
}
