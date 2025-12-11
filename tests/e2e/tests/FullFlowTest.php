<?php

namespace Tests;

use GuzzleHttp\Psr7\Response;

class FullFlowTest extends E2ETestCase
{
    public function test_services_are_healthy()
    {
        $this->mockHandler->append(
            new Response(200, [], json_encode([
                'services' => ['api-gateway' => ['status' => 'healthy']]
            ]))
        );

        // Check API Gateway Health
        $response = $this->client->get('services/health');
        $this->assertEquals(200, $response->getStatusCode(), 'API Gateway should be healthy');
        
        $data = json_decode($response->getBody(), true);
        $this->assertEquals('healthy', $data['services']['api-gateway']['status'] ?? null);
    }

    public function test_customer_creation_flow()
    {
        // Mock responses: 1. Create Customer, 2. Get Customer
        $this->mockHandler->append(
            new Response(201, [], json_encode(['id' => 'test-cust-id', 'name' => 'E2E Test User'])),
            new Response(200, [], json_encode(['id' => 'test-cust-id', 'name' => 'E2E Test User']))
        );

        // 1. Create a Customer
        $externalId = 'e2e_user_' . time();
        $response = $this->client->post('customers', [
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
        $getResponse = $this->client->get("customers/{$customer['id']}");
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
        // Mock responses: 1. Create Bot, 2. Create Conversation, 3. Send Message
        $this->mockHandler->append(
            new Response(201, [], json_encode(['id' => 'bot-id'])),
            new Response(201, [], json_encode(['id' => 'conv-id'])),
            new Response(201, [], json_encode(['id' => 'msg-id']))
        );

        // 1. Create a Bot
        $botId = 'e2e_bot_' . time();
        $botResponse = $this->client->post('customers', [
            'json' => [
                'external_id' => $botId,
                'external_type' => 'assistant',
                'name' => 'E2E Bot'
            ]
        ]);
        $bot = json_decode($botResponse->getBody(), true);

        // 2. Create Conversation
        $convResponse = $this->client->post('conversations', [
            'json' => [
                'type' => 'direct',
                'participants' => [$user['id'], $bot['id']]
            ]
        ]);
        
        $this->assertEquals(201, $convResponse->getStatusCode());
        $conversation = json_decode($convResponse->getBody(), true);
        $this->assertArrayHasKey('id', $conversation);

        // 3. Send Message
        $msgResponse = $this->client->post('messages', [
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
