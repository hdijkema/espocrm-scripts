<?php
class AfterUninstall
{
  private function info($msg)
  {
	  $GLOBALS['log']->warning('Scripts Module: ' . $msg);
  }
  
  public function run($container) 
  {
      $sys = new Espo\Core\Utils\System();
      $root_dir = $sys->getRootDir();
      $custom_dir = 'custom/Espo/Custom/Resources/metadata';
      $custom_css_cfg_file = $custom_dir . '/app/client.json';
      $css_f = $root_dir . '/' . $custom_css_cfg_file;
      
      $my_css_dir = 'client/modules/scripts/css';
      
      $css_files = [ "$my_css_dir/scripts.css", "$my_css_dir/datatables.min.css" ];
      
      $this->info('Uninstalling...');
      $this->info('EspoCRM root directory = ' . $root_dir);
      
      $this->info('Modifying or creating ' . $css_f);
     

      if (file_exists($css_f)) {
         $json = file_get_contents($css_f);
      } else {
         $json = "{ \"cssList\": [ ] }";
      }
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

      # Because the Script type may have been used in other Entities, we need to make 
      # sure, these entities will still be available. As any type defaults to varchar(255)
      # and the script type is of type text, we'll create a custom field type 'Script' that
      # is of type 'text'.
     
      $script_field_d = $root_dir . '/' . $custom_dir . '/fields'; 
      $script_field_f = $script_field_d . '/fields/script.json';

      if (!is_dir($script_field_d)) { 
          mkdir($script_field_d, 0755, true);
      }

      if (file_exists($script_field_f)) {
          $custom_script_field = json_decode(file_get_contents($script_field_f));
      } else {
          $custom_script_field = json_decode('{ "fieldDefs": { "type": "text" }}');
      }

      $custom_script_field->fieldDefs->type = "text"; 

      file_put_contents($script_field_f, json_encode($custom_script_field, JSON_PRETTY_PRINT));

      $this->info('done.');
  }}
?>
