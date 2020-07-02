<?php
class AfterUninstall
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
      
      $this->info('Uninstalling...');
      $this->info('EspoCRM root directory = ' . $root_dir);
      
      $this->info('Modifying or creating ' . $css_f);
      
      $json = file_get_contents($css_f);
      $this->info('Json = ' . $json);
      
      $obj = json_decode($json);
      
      $css = $obj->cssList;
      $css = array_diff($css, $css_files);
      foreach ($css_files as $css_e) {
          $this->info('Removed ' . $css_e . ' from cssList');
      }
      $obj->cssList = $css;
      
      $json = json_encode($obj, JSON_PRETTY_PRINT);
      
      file_put_contents($css_f, $json);
      
      $this->info('done.');
  }}
?>
