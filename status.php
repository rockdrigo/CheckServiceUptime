<?php


    $host = $_POST['host'];
    $port = $_POST['port'];
    $timeout = $_POST['timeout'];


$starttime = microtime(true);

$fp = fsockopen($host, $port, $errno, $errstr,$timeout);


if ($fp) {
    fclose($fp); // trim the result and remove the starting ?
    $response = [
            'status' => 'ok',
        ];
    }else{
        $response = [
            'status' => 'error',
        ];
    }
    $encoded = json_encode($response);
    header('Content-type: application/json');
    echo $encoded;
    exit;

?>
