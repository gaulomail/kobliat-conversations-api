<?php

namespace Tests;

class FullFlowTest extends BaseE2ETest
{
    public function test_services_are_healthy()
    {
        // Check API Gateway Health
        $response = $this->client->get('/health');
        $this->assertEquals(200, $response->getStatusCode(), 'API Gateway should be healthy');
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('healthy', $data['status'] ?? null);
        $this->assertEquals('api-gateway', $data['service'] ?? null);
    }

    public function test_customer_creation_flow()
    {
        // 1. Create a Customer
        $externalId = 'e2e_user_' . time();
        $response = $this->client->post('/customers', [
            'json' => [
                'external_id' => $externalId,
                'external_type' => 'web',
                'name' => 'E2E Test User'
            ]
        ]);
        
        $this->assertEquals(201, $response->getStatusCode(), 'Should be able to create customer');
        $customer = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('id', $customer);
        
        // 2. Retrieve Created Customer
        $getResponse = $this->client->get("/customers/{$customer['id']}");
        $this->assertEquals(200, $getResponse->getStatusCode());
        $fetchedCustomer = json_decode($getResponse->getBody(), true);
        $this->assertEquals($customer['id'], $fetchedCustomer['id']);
        
        return $customer;
    }

    /**
     * @depends test_customer_creation_flow
     */
    public function test_conversation_flow($user)
    {
        // 1. Create a Bot
        $botId = 'e2e_bot_' . time();
        $botResponse = $this->client->post('/customers', [
            'json' => [
                'external_id' => $botId,
                'external_type' => 'assistant',
                'name' => 'E2E Bot'
            ]
        ]);
        $bot = json_decode($botResponse->getBody(), true);

        // 2. Create Conversation
        $convResponse = $this->client->post('/conversations', [
            'json' => [
                'type' => 'direct',
                'participants' => [$user['id'], $bot['id']]
            ]
        ]);
        
        $this->assertEquals(201, $convResponse->getStatusCode());
        $conversation = json_decode($convResponse->getBody(), true);
        $this->assertArrayHasKey('id', $conversation);

        // 3. Send Message
        $msgResponse = $this->client->post('/messages', [
            'json' => [
                'conversation_id' => $conversation['id'],
                'direction' => 'outbound',
                'body' => 'Hello from E2E',
                'sender_customer_id' => $user['id']
            ]
        ]);
        
        $this->assertEquals(201, $msgResponse->getStatusCode());
        
        return $conversation;
    }
}
