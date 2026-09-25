pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    environment {
        IMAGE_NAME   = "ghcr.io/zayedhamadi/frontend-microservice"
        IMAGE_TAG    = "${env.GIT_COMMIT.take(7)}"
        SONAR_SERVER = "sonarqube"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'dev',
                    credentialsId: 'github-account',
                    url: 'https://github.com/zayedhamadi/microservice_intern_front.git'
            }
        }

        stage('Generate environment.ts') {
            steps {
                withCredentials([string(credentialsId: 'keycloak_secret', variable: 'KC_SECRET')]) {
                    sh '''
                        set -e
                        sed "s|__KEYCLOAK_CLIENT_SECRET__|$KC_SECRET|g" \
                            src/app/core/environement/environment.template.ts \
                            > src/app/core/environement/environment.ts
                    '''
                }
            }
        }

       stage('Trivy FS Scan') {
    steps {
        sh """
            trivy fs \
                --exit-code 1 \
                --severity CRITICAL \
                --ignore-unfixed \
                --scanners vuln,secret \
                --ignorefile .trivyignore \
                .
        """
    }
}
        stage('Install & Build') {
            steps {
                script {
                    docker.image('node:20-alpine').inside {
                        retry(2) { sh 'npm ci' }
                        sh 'npm run build -- --configuration=production'
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    docker.image('sonarsource/sonar-scanner-cli').inside("--network stage-network") {
                        withSonarQubeEnv(SONAR_SERVER) {
                            sh '''
                                sonar-scanner \
                                    -Dsonar.projectKey=stage-frontend \
                                    -Dsonar.sources=src \
                                    -Dsonar.exclusions=**/node_modules/**,**/dist/**
                            '''
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Image') {
            steps {
                script { docker.build("${IMAGE_NAME}:${IMAGE_TAG}") }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh """
                    trivy image \
                        --exit-code 1 \
                        --severity CRITICAL \
                        --ignore-unfixed \
                        ${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }

        stage('Push to GHCR') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'GHCR_SECRET', usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_PASS')]) {
                    sh '''
                        set -e
                        echo "$GHCR_PASS" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
                    '''
                    sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                }
            }
        }

        stage('Update hirely-devops') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-account', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                    sh """
                        set -e
                        rm -rf hirely-devops-update
                        git clone --depth 1 https://\$GIT_USER:\$GIT_TOKEN@github.com/zayedhamadi/hirely-devops.git hirely-devops-update
                        cd hirely-devops-update/overlays/prod
                        kustomize edit set image ${IMAGE_NAME}=${IMAGE_NAME}:${IMAGE_TAG}
                        git config user.email "jenkins@hirely.local"
                        git config user.name "Jenkins CI"
                        git diff --staged --quiet || git commit -am "chore: bump frontend to ${IMAGE_TAG}"
                        git push origin main
                    """
                }
            }
        }

        stage('Trivy Config Scan (K8s/IaC)') {
            steps {
                sh """
                    trivy config \
                        --exit-code 1 \
                        --severity CRITICAL,HIGH \
                        hirely-devops-update/kubernetes/
                """
            }
        }

        stage('Sync ArgoCD') {
            steps {
                withCredentials([string(credentialsId: 'argocd-token', variable: 'ARGOCD_TOKEN')]) {
                    retry(2) {
                        sh """
                            argocd app sync hirely \
                                --grpc-web \
                                --server argocd.hirely.local \
                                --auth-token \$ARGOCD_TOKEN \
                                --insecure \
                                --timeout 180
                        """
                    }
                }
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
                    sleep 20
                    chmod +x hirely-devops-update/scripts/smoke-test.sh
                    hirely-devops-update/scripts/smoke-test.sh
                '''
            }
        }
    }

    post {
        always {
            sh '''
                USAGE=$(df -P / | tail -1 | awk '{print $5}' | tr -d '%')
                echo "Disk usage: ${USAGE}%"
                if [ "$USAGE" -gt 75 ]; then
                    echo "Seuil dépassé, nettoyage Docker..."
                    docker image prune -af --filter "until=48h" || true
                    docker builder prune -af --filter "until=48h" || true
                else
                    echo "Disque OK, pas de cleanup."
                fi
            '''
            cleanWs(deleteDirs: true, notFailBuild: true)
        }
        success {
            echo "Build et déploiement réussis pour frontend #${env.BUILD_NUMBER} (image ${IMAGE_TAG})"
        }
        failure {
            emailext(
                to: 'zayedh80@gmail.com',
                subject: "Échec pipeline frontend #${env.BUILD_NUMBER}",
                body: "Le build a échoué : ${env.BUILD_URL}console"
            )
        }
    }
}
