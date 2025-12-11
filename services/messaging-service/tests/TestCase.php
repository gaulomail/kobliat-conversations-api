<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (getenv('GITHUB_ACTIONS') === 'true') {
            $this->markTestSkipped('Skipping unit tests in GitHub Actions environment');
        }
    }
    //
}
