/*
* @Author: colxi
* @Date:   2018-08-24 21:56:14
* @Last Modified by:   colxi
* @Last Modified time: 2018-08-24 22:36:00
*/
module.exports = function (grunt) {
    grunt.initConfig({
        // define source files and their destinations
        uglify: {
            files: {
                cwd: 'src/',
                src: '**/*.js',  // source files mask
                dest: 'build/',    // destination folder
                expand: true,    // allow dynamic building
                flatten: false,   // remove all unnecessary nesting
                ext: '.js'   // replace .js to .min.js
            }
        },
        watch: {
            js:  { files: 'src/**/*.js', tasks: [ 'uglify' ] },
        }
    });

    // load plugins
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify-es');

    // register at least this one task
    grunt.registerTask('default', [ 'uglify' ]);
}
