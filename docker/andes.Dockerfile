ARG APP=master
ARG MATRICULACIONES=master
ARG MONITOREO=master
ARG MOBILE=master

FROM andesnqn/app:${APP} as build-stage
FROM andesnqn/matriculaciones:${MATRICULACIONES} as build-matriculaciones
FROM andesnqn/monitoreo:${MONITOREO} as build-monitoreo
FROM andesnqn/mobile:${MOBILE} as build-mobile

FROM nginx

COPY --from=build-stage /usr/src/app/dist /usr/share/nginx/html
COPY --from=build-matriculaciones /usr/src/app/dist /usr/share/nginx/html/matriculaciones
COPY --from=build-monitoreo /usr/src/app/dist /usr/share/nginx/html/monitoreo
COPY --from=build-mobile /usr/src/app/platforms/browser /usr/share/nginx/html/browser
RUN mv /usr/share/nginx/html/browser/www /usr/share/nginx/html/browser/mobile

COPY nginx.conf /etc/nginx/nginx.conf
#RUN ls /usr/share/nginx/html
#RUN nginx 

EXPOSE 80
#CMD ["nginx"]
