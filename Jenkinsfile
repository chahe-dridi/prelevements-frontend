pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('SONAR_TOKEN')
        DOCKER_IMAGE = 'prelevements-frontend:dev'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/chahe-dridi/prelevements-frontend.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    docker.image('node:18-alpine').inside {
                        sh 'npm install'
                    }
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    docker.image('node:18-alpine').inside {
                        sh 'npm test -- --coverage'
                    }
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    docker.image('node:18-alpine').inside {
                        sh 'npm run build'
                    }
                }
            }
        }

    stage('SonarQube Analysis') {
    steps {
        withSonarQubeEnv('My SonarQube Server') {
            script {
                docker.image('sonarsource/sonar-scanner-cli:latest').inside {
                    sh "sonar-scanner -Dsonar.projectKey=prelevements_front -Dsonar.login=${SONAR_TOKEN}"
                }
            }
        }
    }
}



        stage('Docker Build & Push') {
            steps {
                script {
                    docker.build(DOCKER_IMAGE)
                }
            }
        }
    }
}
