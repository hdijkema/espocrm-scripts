<?php

use \Espo\Core\Utils\System;

class AfterInstall
{
  private function info($msg)
  {
	  $GLOBALS['log']->info('Scripts Module: ' . $msg);
  }
  
  public function run($container) 
  {
      $sys = new Espo\Core\Utils\System();
      $root_dir = $sys->getRootDir();
      $custom_css_cfg_file = 'custom/Espo/Custom/Resources/metadata/app/client.json';
      $css_f = $root_dir . '/' . $custom_css_cfg_file;
      
      $my_css_dir = 'client/modules/scripts/css';
      
      $css_files = [ "$my_css_dir/scripts.css", "$my_css_dir/datatables.min.css" ];
      
      $this->info('Installing...');
      $this->info('EspoCRM root directory = ' . $root_dir);
      
      $this->info('Modifying or creating ' . $css_f);
      
      $json = file_get_contents($css_f);
      $this->info('Json = ' . $json);
      
      $obj = json_decode($json);
      
      $css = $obj->cssList;
      foreach ($css_files as $css_e) {
          if (!in_array($css_e, $css)) {
              array_push($css, $css_e);
              $this->info('Added ' . $css_e . ' to entry cssList');
          } else {
              $this->info('Already in cssList: ' . $css_e);
          }
      }
      $obj->cssList = $css;
      
      $json = json_encode($obj, JSON_PRETTY_PRINT);
      
      file_put_contents($css_f, $json);
      
      $this->info('done.');
  }
}
?>
