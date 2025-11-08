# Usage Examples

This document provides practical examples of how to use the Alloy Connectivity API for various integration scenarios.

## Basic Examples

### Example 1: Simple Contact Sync

Sync a contact from your application to a CRM:

```typescript
import { AlloyClient } from './src/alloy-client';
import { getConfig } from './src/config';

const config = getConfig();
const client = new AlloyClient(config);

// Create a contact in Salesforce
const newContact = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  phone: '+1-555-1234',
  company: 'Tech Solutions Inc',
  title: 'Software Engineer'
};

await client.writeData(
  config.alloyUserId,
  'salesforce',
  'contacts',
  newContact
);
```

### Example 2: Batch Read Operations

Read multiple records from a CRM:

```typescript
// Fetch all contacts
const contacts = await client.readData(
  config.alloyUserId,
  'salesforce',
  'contacts'
);

console.log(`Found ${contacts.length} contacts`);

// Process each contact
contacts.forEach(contact => {
  console.log(`${contact.firstName} ${contact.lastName} - ${contact.email}`);
});
```

### Example 3: Update Existing Record

Update a contact's information:

```typescript
// Update a specific contact
await client.updateData(
  config.alloyUserId,
  'salesforce',
  'contacts',
  'contact_id_123',
  {
    phone: '+1-555-9999',
    title: 'Senior Software Engineer',
    company: 'New Company LLC'
  }
);
```

## Real-World Use Cases

### Use Case 1: Lead Capture from Website

Automatically create leads in your CRM when users submit a form on your website:

```typescript
// In your web application's API endpoint
async function handleFormSubmission(formData: any) {
  const config = getConfig();
  const client = new AlloyClient(config);

  const leadData = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    company: formData.company,
    source: 'Website Form',
    status: 'New Lead'
  };

  try {
    await client.writeData(
      config.alloyUserId,
      'salesforce',
      'leads',
      leadData
    );
    
    console.log('Lead created successfully in CRM');
    return { success: true };
  } catch (error) {
    console.error('Failed to create lead:', error);
    return { success: false, error: error.message };
  }
}
```

### Use Case 2: Two-Way CRM Sync

Synchronize contacts between two different CRM systems:

```typescript
async function syncCRMs() {
  const config = getConfig();
  const client = new AlloyClient(config);

  // Read contacts from Salesforce
  const salesforceContacts = await client.readData(
    config.alloyUserId,
    'salesforce',
    'contacts'
  );

  // Write each contact to HubSpot
  for (const contact of salesforceContacts) {
    const hubspotContact = {
      firstname: contact.firstName,
      lastname: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      company: contact.company
    };

    await client.writeData(
      config.alloyUserId,
      'hubspot',
      'contacts',
      hubspotContact
    );
  }

  console.log(`Synced ${salesforceContacts.length} contacts from Salesforce to HubSpot`);
}
```

### Use Case 3: Customer Data Enrichment

Enrich customer data by combining information from multiple sources:

```typescript
async function enrichCustomerData(email: string) {
  const config = getConfig();
  const client = new AlloyClient(config);

  // Get contact from CRM
  const crmContacts = await client.readData(
    config.alloyUserId,
    'salesforce',
    'contacts'
  );
  const crmContact = crmContacts.find(c => c.email === email);

  // Get marketing data
  const marketingData = await client.readData(
    config.alloyUserId,
    'mailchimp',
    'members'
  );
  const marketingContact = marketingData.find(m => m.email_address === email);

  // Combine and enrich data
  const enrichedData = {
    ...crmContact,
    marketingOptIn: marketingContact?.status === 'subscribed',
    emailEngagement: marketingContact?.stats?.avg_open_rate,
    tags: marketingContact?.tags || []
  };

  // Update CRM with enriched data
  await client.updateData(
    config.alloyUserId,
    'salesforce',
    'contacts',
    crmContact.id,
    enrichedData
  );

  return enrichedData;
}
```

### Use Case 4: Support Ticket Integration

Link support tickets with CRM contacts:

```typescript
async function createSupportTicketFromCRM(contactEmail: string, issue: string) {
  const config = getConfig();
  const client = new AlloyClient(config);

  // Find contact in CRM
  const contacts = await client.readData(
    config.alloyUserId,
    'salesforce',
    'contacts'
  );
  const contact = contacts.find(c => c.email === contactEmail);

  if (!contact) {
    throw new Error('Contact not found in CRM');
  }

  // Create support ticket
  const ticketData = {
    subject: `Issue reported by ${contact.firstName} ${contact.lastName}`,
    description: issue,
    requester: {
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email
    },
    priority: 'normal',
    status: 'open',
    tags: ['crm-integration', contact.company || 'unknown']
  };

  const ticket = await client.writeData(
    config.alloyUserId,
    'zendesk',
    'tickets',
    ticketData
  );

  console.log(`Created support ticket #${ticket.id} for ${contactEmail}`);
  return ticket;
}
```

## Advanced Examples

### Example 4: Error Handling and Retry Logic

Implement robust error handling with retries:

```typescript
async function syncWithRetry(
  maxRetries: number = 3,
  delayMs: number = 1000
) {
  const config = getConfig();
  const client = new AlloyClient(config);

  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const result = await client.writeData(
        config.alloyUserId,
        'salesforce',
        'contacts',
        { /* data */ }
      );
      
      console.log('Sync successful');
      return result;
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        console.error(`Failed after ${maxRetries} attempts`);
        throw error;
      }
      
      console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
}
```

### Example 5: Bulk Operations with Rate Limiting

Process large datasets with rate limiting:

```typescript
async function bulkSync(contacts: any[], rateLimit: number = 5) {
  const config = getConfig();
  const client = new AlloyClient(config);

  const chunks = [];
  for (let i = 0; i < contacts.length; i += rateLimit) {
    chunks.push(contacts.slice(i, i + rateLimit));
  }

  let processed = 0;
  
  for (const chunk of chunks) {
    const promises = chunk.map(contact =>
      client.writeData(
        config.alloyUserId,
        'salesforce',
        'contacts',
        contact
      )
    );

    await Promise.all(promises);
    processed += chunk.length;
    
    console.log(`Processed ${processed}/${contacts.length} contacts`);
    
    // Wait between batches to respect rate limits
    if (processed < contacts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('Bulk sync completed');
}
```

### Example 6: Webhook Integration

Create a webhook handler for real-time syncing:

```typescript
import express from 'express';

const app = express();
app.use(express.json());

// Webhook endpoint that syncs data when triggered
app.post('/webhook/contact-created', async (req, res) => {
  const config = getConfig();
  const client = new AlloyClient(config);

  try {
    const contactData = req.body;
    
    // Sync to CRM
    await client.writeData(
      config.alloyUserId,
      'salesforce',
      'contacts',
      contactData
    );

    res.json({ success: true, message: 'Contact synced to CRM' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

## Using the REST API Directly

If you prefer not to use the SDK, you can use the REST API directly:

```typescript
import { AlloyRestClient } from './src/rest-api-example';
import { getConfig } from './src/config';

const config = getConfig();
const client = new AlloyRestClient(
  config.alloyApiKey,
  config.alloyBaseUrl,
  config.alloyUserId
);

// Same operations as SDK, but using REST calls
const contacts = await client.readData(
  config.alloyUserId,
  'salesforce',
  'contacts'
);

await client.createData(
  config.alloyUserId,
  'salesforce',
  'contacts',
  { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
);
```

## Testing and Development

### Mock Data for Testing

```typescript
const mockContact = {
  firstName: 'Test',
  lastName: 'User',
  email: `test.${Date.now()}@example.com`, // Unique email
  phone: '+1-555-0000',
  company: 'Test Company'
};

// Use in tests
await client.writeData(
  config.alloyUserId,
  'salesforce',
  'contacts',
  mockContact
);
```

### Environment-Specific Configuration

```typescript
const integrationId = process.env.NODE_ENV === 'production'
  ? 'salesforce-prod'
  : 'salesforce-dev';

await client.readData(config.alloyUserId, integrationId, 'contacts');
```

## Best Practices

1. **Always validate data before syncing**
   ```typescript
   function validateContact(contact: any): boolean {
     return !!(contact.email && contact.firstName && contact.lastName);
   }
   ```

2. **Log all sync operations for debugging**
   ```typescript
   console.log(`[${new Date().toISOString()}] Syncing contact: ${contact.email}`);
   ```

3. **Handle partial failures gracefully**
   ```typescript
   const results = await Promise.allSettled(promises);
   const failed = results.filter(r => r.status === 'rejected');
   if (failed.length > 0) {
     console.error(`${failed.length} operations failed`);
   }
   ```

4. **Use idempotency keys for critical operations**
   ```typescript
   const idempotencyKey = `contact-${contact.email}-${Date.now()}`;
   // Include in your API calls to prevent duplicates
   ```

## Additional Resources

- See `src/demo.ts` for the complete working example
- Check `src/alloy-client.ts` for all available methods
- Review `src/rest-api-example.ts` for REST API usage

For more information, visit the [Alloy Documentation](https://docs.runalloy.com).
