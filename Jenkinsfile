pipeline {
    agent any

    environment {
        IMAGE_NAME = "stage-frontend"
        IMAGE_TAG  = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'dev',
                    credentialsId: 'git_ssh',
                    url: 'https://github.com/zayedhamadi/microservice_intern_front.git'
            }
        }

        stage('Install & Build') {
            steps {
                script {
                    docker.image('node:20-alpine').inside {
                        sh 'npm ci'
                        sh 'npm run build -- --configuration=production'
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    docker.build("${IMAGE_NAME}:${IMAGE_TAG}")
                }
            }
        }
    }

    post {
        success { echo "Build réussi pour frontend #${env.BUILD_NUMBER}" }
        failure { echo "Échec du pipeline frontend #${env.BUILD_NUMBER}" }
    }
}