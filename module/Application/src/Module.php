<?php

/**
 * @see       https://github.com/laminas/laminas-mvc-skeleton for the canonical source repository
 * @copyright https://github.com/laminas/laminas-mvc-skeleton/blob/master/COPYRIGHT.md
 * @license   https://github.com/laminas/laminas-mvc-skeleton/blob/master/LICENSE.md New BSD License
 */

declare(strict_types=1);

namespace Application;

use Laminas\Mvc\MvcEvent;
use Laminas\Session\Container;

class Module
{
    public function onBootstrap(MvcEvent $e)
    {
        //Utilisé pour générer un "session_id"
        $container = new Container('initialized');
    }

    public function getConfig() : array
    {
        return include __DIR__ . '/../config/module.config.php';
    }
}
