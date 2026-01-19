import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Evolution API webhook payload types
interface EvolutionWebhookPayload {
  event?: string;
  instance?: string;
  data?: {
    key?: {
      remoteJid?: string;
      id?: string;
      fromMe?: boolean;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
    };
  };
  sender?: string;
  server_url?: string;
  apikey?: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const payload: EvolutionWebhookPayload = await request.json();
    
    // Log full payload for debugging
    console.log('\n=== Webhook Received ===');
    console.log('Full payload:', JSON.stringify(payload, null, 2));
    
    // Extract message information based on Evolution API structure
    let messageText: string | null = null;
    let senderPhone: string | null = null;
    let messageId: string | null = null;
    
    // Evolution API typically sends data in different formats
    // Handle common structures
    if (payload.data) {
      const data = payload.data;
      
      // Extract sender phone number (remoteJid)
      if (data.key?.remoteJid) {
        senderPhone = data.key.remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
      }
      
      // Extract message ID
      if (data.key?.id) {
        messageId = data.key.id;
      }
      
      // Extract message text from different message types
      if (data.message) {
        const message = data.message;
        
        // Text message (simple)
        if (message.conversation) {
          messageText = message.conversation;
        }
        // Extended text message
        else if (message.extendedTextMessage?.text) {
          messageText = message.extendedTextMessage.text;
        }
        // Other message types can be added here
      }
    }
    
    // Log extracted information
    console.log('\n--- Extracted Information ---');
    console.log('Sender Phone:', senderPhone || 'Not found');
    console.log('Message ID:', messageId || 'Not found');
    console.log('Message Text:', messageText || 'Not found');
    console.log('===========================\n');
    
    // Send hardcoded reply if it's a message event and not from me
    if (payload.event === 'messages.upsert' && payload.data?.key?.fromMe === false && messageText) {
      try {
        // Get Evolution API configuration from payload or environment
        const evolutionApiUrl = payload.server_url || process.env.EVOLUTION_API_URL || 'http://localhost:8080';
        const evolutionApiKey = payload.apikey || process.env.EVOLUTION_API_KEY || '';
        const instanceName = payload.instance || process.env.EVOLUTION_INSTANCE_NAME || 'default';
        
        // Get sender's WhatsApp ID (use sender from payload or construct from remoteJid)
        const senderWhatsAppId = payload.sender || payload.data?.key?.remoteJid || '';
        
        if (senderWhatsAppId) {
          // Hardcoded reply message
          const replyMessage = 'how is it going?';
          
          // Send message via Evolution API
          const sendMessageUrl = `${evolutionApiUrl}/message/sendText/${instanceName}`;
          
          console.log('\n--- Sending Reply ---');
          console.log('To:', senderWhatsAppId);
          console.log('Message:', replyMessage);
          
          await axios.post(
            sendMessageUrl,
            {
              number: senderWhatsAppId,
              text: replyMessage,
            },
            {
              headers: {
                'apikey': evolutionApiKey,
                'Content-Type': 'application/json',
              },
            }
          );
          
          console.log('Reply sent successfully!\n');
        }
      } catch (error: any) {
        console.error('Error sending reply:', error.response?.data || error.message);
      }
    }
    
    // Return success response to Evolution API
    return NextResponse.json(
      { 
        status: 'received',
        message: 'Webhook processed successfully'
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to process webhook'
      },
      { status: 500 }
    );
  }
}
