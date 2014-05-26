(function() {
  module.exports = function(grunt) {
    grunt.initConfig({
      coffee: {
        all: {
          expand: true,
          src: '**/*.coffee',
          ext: '.js'
        }
      },
      watch: {
        html: {
          files: ['*.html'],
          options: {
            livereload: true
          }
        },
        scripts: {
          files: ['*.js'],
          options: {
            livereload: true
          }
        },
        coffee: {
          files: ['Gruntfile.coffee', '**/*.coffee'],
          tasks: ["coffee"],
          options: {
            livereload: true
          }
        }
      },
      connect: {
        server: {
          options: {
            base: './'
          }
        }
      }
    });
    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    return grunt.registerTask('default', ['connect', 'coffee', 'watch']);
  };

}).call(this);
