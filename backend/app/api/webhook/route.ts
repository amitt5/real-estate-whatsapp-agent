import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// WasenderAPI webhook payload types
interface WasenderMessageKey {
  id?: string;
  fromMe?: boolean;
  remoteJid?: string;
  cleanedSenderPn?: string;
  cleanedParticipantPn?: string;
}

interface WasenderMessagesPayload {
  key?: WasenderMessageKey;
  messageBody?: string;
  message?: {
    conversation?: string;
  };
  [key: string]: any;
}

interface WasenderWebhookPayload {
  event?: string;
  timestamp?: number;
  data?: {
    messages?: WasenderMessagesPayload;
    [key: string]: any;
  };
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const payload: WasenderWebhookPayload = await request.json();

    // Log full payload for debugging
    console.log('\n=== Webhook Received (WasenderAPI) ===');
    console.log('Full payload:', JSON.stringify(payload, null, 2));

    // Extract message information based on WasenderAPI structure
    let messageText: string | null = null;
    let senderPhone: string | null = null;
    let messageId: string | null = null;
    let fromMe: boolean | undefined;

    const messages = payload.data?.messages;

    if (messages) {
      const key = messages.key;
      fromMe = key?.fromMe;
      messageId = key?.id || null;

      // Prefer cleanedSenderPn for private chats, fallback to cleanedParticipantPn for groups
      senderPhone =
        key?.cleanedSenderPn ||
        key?.cleanedParticipantPn ||
        null;

      // Unified message body field
      if (messages.messageBody) {
        messageText = messages.messageBody;
      } else if (messages.message?.conversation) {
        messageText = messages.message.conversation;
      }
    }

    // Log extracted information
    console.log('\n--- Extracted Information (WasenderAPI) ---');
    console.log('Event:', payload.event || 'Not found');
    console.log('Sender Phone:', senderPhone || 'Not found');
    console.log('Message ID:', messageId || 'Not found');
    console.log('FromMe:', fromMe ?? 'Not found');
    console.log('Message Text:', messageText || 'Not found');
    console.log('=========================================\n');

    // Decide when to reply:
    // - Event is one of the incoming message events
    // - Message is not from this session (fromMe === false)
    // - We have a sender phone and some text
    const isIncomingEvent =
      payload.event === 'messages.received' ||
      payload.event === 'personal.message.received' ||
      payload.event === 'messages.upsert';

    if (isIncomingEvent && fromMe === false && senderPhone && messageText) {
      try {
        const baseUrl =
          process.env.WASENDER_API_BASE_URL?.replace(/\/+$/, '') ||
          'https://wasenderapi.com/api';
        const apiToken = process.env.WASENDER_API_TOKEN;

        if (!apiToken) {
          console.warn(
            'WASENDER_API_TOKEN is not set. Skipping reply send.'
          );
        } else {
          const sendMessageUrl = `${baseUrl}/send-message`;
          const replyMessage = 'how is it going?';

          // Ensure phone number is in E.164 format (prefix with + if missing)
          const to =
            senderPhone.startsWith('+') ? senderPhone : `+${senderPhone}`;

          console.log('\n--- Sending Reply via WasenderAPI ---');
          console.log('To:', to);
          console.log('Message:', replyMessage);
          console.log('POST', sendMessageUrl);

          await axios.post(
            sendMessageUrl,
            {
              to,
              text: replyMessage,
            },
            {
              headers: {
                Authorization: `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log('Reply sent successfully via WasenderAPI!\n');
        }
      } catch (error: any) {
        console.error('Error sending reply via WasenderAPI:');
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        } else {
          console.error('Message:', error.message);
        }
      }
    } else {
      console.log('\n--- Reply NOT sent (WasenderAPI conditions not met) ---');
      console.log('isIncomingEvent:', isIncomingEvent);
      console.log('fromMe:', fromMe);
      console.log('senderPhone:', senderPhone);
      console.log('messageText:', messageText);
      console.log('------------------------------------------------------\n');
    }

    // Return success response to WasenderAPI
    return NextResponse.json(
      {
        status: 'received',
        message: 'Webhook processed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing WasenderAPI webhook:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to process webhook',
      },
      { status: 500 }
    );
  }
}
