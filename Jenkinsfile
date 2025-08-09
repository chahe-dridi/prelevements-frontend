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
                sh 'npm install'
            }
        }

        stage('Test') {
            steps {
                // Run frontend tests here
                sh 'npm test -- --coverage'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('My SonarQube Server') {
                    sh "npx sonar-scanner -Dsonar.projectKey=prelevements_front -Dsonar.login=${SONAR_TOKEN}"
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
