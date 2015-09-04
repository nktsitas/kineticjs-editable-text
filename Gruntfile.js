/* global module */
module.exports = function (grunt) {

    var config = {
        pkg: grunt.file.readJSON('package.json'),
        app: 'source',
        dist: 'dist'
    };

    // Configuration
    grunt.initConfig({
        config: config,
        pkg: config.pkg,
        jshint: {
            files: ['Gruntfile.js', 'source/**/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        concat: {
            options: {
                separator: ';',
                banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                src: ['source/**/*.js'],
                dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('publish', ['jshint', 'concat', 'uglify']);
};