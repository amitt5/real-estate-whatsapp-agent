import { NextRequest, NextResponse } from 'next/server';

// Evolution API webhook payload types
interface EvolutionWebhookPayload {
  event?: string;
  data?: {
    key?: {
      remoteJid?: string;
      id?: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
    };
  };
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
